export const dynamic = "force-dynamic";
// ═══════════════════════════════════════════════════════════════
// Admin: Kapitalschutz-Berechnung
// Berechnet wie viel Geld durch abgelehnte Signale gespart wurde
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

const META_CLIENT_BASE = "https://mt-client-api-v1.new-york.agiliumtrade.ai";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createSupabaseAdmin();

    // Check admin
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Get all signals
    const { data: allSignals } = await db
      .from("telegram_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!allSignals?.length) {
      return NextResponse.json({
        totalBlocked: 0,
        totalSaved: 0,
        breakdown: {},
        blockedSignals: [],
      });
    }

    // Categorize signals
    const executed = allSignals.filter((s: any) => s.status === "executed");
    const blocked = allSignals.filter((s: any) =>
      ["low_confidence", "risk_blocked", "rejected_no_sl", "unparsed", "execution_failed", "manual_review"].includes(s.status)
    );

    // Calculate savings for blocked signals
    let totalSaved = 0;
    const breakdown: Record<string, { count: number; saved: number }> = {
      rejected_no_sl: { count: 0, saved: 0 },
      low_confidence: { count: 0, saved: 0 },
      risk_blocked: { count: 0, saved: 0 },
      execution_failed: { count: 0, saved: 0 },
      unparsed: { count: 0, saved: 0 },
      manual_review: { count: 0, saved: 0 },
    };

    const blockedDetails: any[] = [];

    for (const signal of blocked) {
      const parsed = signal.parsed as any;
      if (!parsed) continue;

      const status = signal.status || "unknown";
      if (!breakdown[status]) breakdown[status] = { count: 0, saved: 0 };
      breakdown[status].count++;

      // Estimate potential loss for this signal
      let estimatedLoss = 0;

      if (parsed.action === "BUY" || parsed.action === "SELL") {
        const entry = parsed.entryPrice;
        const sl = parsed.stopLoss;
        const tps = parsed.takeProfits || [];

        if (entry && sl) {
          // Calculate SL distance in $ per lot
          const slDistance = Math.abs(entry - sl);

          // For signals without SL (rejected_no_sl): assume worst case $500 loss
          // For low confidence: assume 60% chance of hitting SL
          // For risk blocked: assume 50% chance of hitting SL
          let lossProb = 0.5;
          if (status === "rejected_no_sl") lossProb = 0.7;
          if (status === "low_confidence") lossProb = 0.6;
          if (status === "risk_blocked") lossProb = 0.5;

          // Estimated loss = SL distance × probability × lot size (0.01-0.1)
          const estimatedLots = 0.05; // average lot size
          const pipValue = parsed.symbol === "XAUUSD" ? 1 : 10;
          estimatedLoss = slDistance * pipValue * estimatedLots * lossProb;
        } else if (status === "rejected_no_sl") {
          // No SL at all — estimate potential unlimited loss
          // Conservative: assume $200-500 loss per trade without SL
          estimatedLoss = 350;
        } else {
          // Unknown signal — estimate small loss
          estimatedLoss = 50;
        }

        totalSaved += estimatedLoss;
        breakdown[status].saved += estimatedLoss;

        blockedDetails.push({
          date: signal.created_at,
          action: parsed.action,
          symbol: parsed.symbol,
          entry: entry,
          sl: sl,
          tp: tps[0] || null,
          confidence: parsed.confidence,
          status,
          estimatedLoss: Math.round(estimatedLoss * 100) / 100,
          reason: getBlockReason(status),
        });
      }
    }

    return NextResponse.json({
      totalBlocked: blocked.length,
      totalExecuted: executed.length,
      totalSaved: Math.round(totalSaved * 100) / 100,
      executionRate: allSignals.length > 0
        ? Math.round((executed.length / allSignals.length) * 100)
        : 0,
      breakdown,
      blockedSignals: blockedDetails.slice(0, 20),
      summary: {
        signalsTotal: allSignals.length,
        signalsExecuted: executed.length,
        signalsBlocked: blocked.length,
        avgConfidenceExecuted: executed.length > 0
          ? Math.round(executed.reduce((s: number, e: any) => s + ((e.parsed as any)?.confidence || 0), 0) / executed.length)
          : 0,
        avgConfidenceBlocked: blocked.length > 0
          ? Math.round(blocked.reduce((s: number, e: any) => s + ((e.parsed as any)?.confidence || 0), 0) / blocked.length)
          : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getBlockReason(status: string): string {
  switch (status) {
    case "rejected_no_sl": return "Kein Stop Loss — unbegrenztes Risiko";
    case "low_confidence": return "KI-Konfidenz zu niedrig (<50%)";
    case "risk_blocked": return "Risk Shield: SL-Distanz >3% oder Tageslimit erreicht";
    case "execution_failed": return "MetaApi Ausführungsfehler";
    case "unparsed": return "Signal konnte nicht erkannt werden";
    case "manual_review": return "Manueller Review erforderlich";
    default: return "Unbekannt";
  }
}
