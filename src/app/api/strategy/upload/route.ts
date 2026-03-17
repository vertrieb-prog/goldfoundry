export const dynamic = "force-dynamic";
// src/app/api/strategy/upload/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const codeText = formData.get("code") as string | null;
    const uploadType = formData.get("type") as string; // mql4, mql5, backtest_csv, backtest_html

    if (!file && !codeText) {
      return NextResponse.json({ error: "File oder Code erforderlich" }, { status: 400 });
    }

    const content = codeText ?? await file!.text();
    const filename = file?.name ?? `manual-${Date.now()}.mq4`;

    const db = createSupabaseAdmin();

    // Create upload record
    const { data: upload, error: insertErr } = await db.from("strategy_uploads").insert({
      user_id: user.id,
      upload_type: uploadType ?? "mql4",
      filename,
      code_content: content,
      status: "analyzing",
    }).select().single();

    if (insertErr) throw insertErr;

    // Analyze with Claude (async — don't block the response)
    analyzeStrategyAsync(upload.id, content, uploadType ?? "mql4", db);

    return NextResponse.json({ success: true, uploadId: upload.id, status: "analyzing" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

async function analyzeStrategyAsync(uploadId: string, content: string, type: string, db: any) {
  try {
    const isMQL = type === "mql4" || type === "mql5";

    const systemPrompt = isMQL
      ? `Du bist ein MQL4/MQL5 Expert und Trading-Strategie-Optimierer für Gold Foundry.
Analysiere den EA-Code und gib ein JSON zurück:
{
  "strategyType": "scalper|grid|trend|swing|news|martingale|other",
  "instruments": ["erkannte Instrumente"],
  "parameters": {"param_name": {"value": "X", "purpose": "Beschreibung"}},
  "riskAssessment": {"level": "LOW|MEDIUM|HIGH|CRITICAL", "issues": ["Problem 1", "Problem 2"]},
  "strengths": ["Stärke 1"],
  "weaknesses": ["Schwäche 1"],
  "optimizations": [{"parameter": "SL", "current": "30", "recommended": "42", "reason": "Historisch optimal für Gold"}],
  "missingFeatures": ["News-Filter fehlt", "etc."],
  "propFirmCompatible": true|false,
  "propFirmIssues": ["Falls nicht kompatibel: warum"],
  "overallScore": 1-10,
  "summary": "1-2 Sätze Gesamtbewertung"
}`
      : `Du bist ein Trading-Datenanalyst für Gold Foundry.
Analysiere die Backtest-Daten und gib ein JSON zurück:
{
  "totalTrades": N,
  "winRate": X.X,
  "profitFactor": X.XX,
  "sharpeRatio": X.XX,
  "maxDrawdown": X.X,
  "netProfit": X.XX,
  "bestTrade": X.XX,
  "worstTrade": X.XX,
  "avgWin": X.XX,
  "avgLoss": X.XX,
  "consistency": X.XX,
  "sessionBreakdown": {"asian": {...}, "london": {...}, "ny": {...}},
  "instrumentBreakdown": {...},
  "propFirmPassRate": X,
  "recommendations": ["Empfehlung 1"],
  "overallScore": 1-10,
  "summary": "Zusammenfassung"
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: content.slice(0, 50000) }], // Limit input
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    let analysis: any;
    try { analysis = JSON.parse(cleaned); } catch { analysis = { error: "Parse failed", raw: text }; }

    // Generate optimized code for MQL
    let optimizedCode: string | null = null;
    if (isMQL && analysis.optimizations?.length > 0) {
      const optResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: "Du bist ein MQL4/MQL5 Entwickler. Optimiere den Code basierend auf den Empfehlungen. Gib NUR den verbesserten Code zurück, keine Erklärung.",
        messages: [{
          role: "user",
          content: `Original:\n${content.slice(0, 30000)}\n\nOptimierungen:\n${JSON.stringify(analysis.optimizations)}`,
        }],
      });
      optimizedCode = optResponse.content[0].type === "text" ? optResponse.content[0].text : null;
    }

    await db.from("strategy_uploads").update({
      ai_analysis: analysis,
      ai_optimized_code: optimizedCode,
      status: "complete",
    }).eq("id", uploadId);

  } catch (err) {
    await db.from("strategy_uploads").update({
      ai_analysis: { error: (err as Error).message },
      status: "failed",
    }).eq("id", uploadId);
  }
}

// GET — Check analysis status
export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get("id");

  const db = createSupabaseAdmin();
  const { data } = await db.from("strategy_uploads")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", uploadId)
    .single();

  return NextResponse.json(data ?? { error: "Not found" });
}
