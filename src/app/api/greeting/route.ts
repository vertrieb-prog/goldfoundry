export const dynamic = "force-dynamic";
// src/app/api/greeting/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const page = new URL(request.url).searchParams.get("page") ?? "/dashboard";

  const [profileRes, accountsRes, tradesRes, earningsRes, memoryRes, intelRes] = await Promise.all([
    db.from("profiles").select("*").eq("id", user.id).single(),
    db.from("slave_accounts").select("*").eq("user_id", user.id),
    db.from("trades").select("profit, close_time, symbol").eq("user_id", user.id).eq("is_open", false).order("close_time", { ascending: false }).limit(100),
    db.from("referral_earnings").select("amount").eq("earner_id", user.id),
    db.from("chat_messages").select("metadata").eq("user_id", user.id).eq("role", "system").order("created_at", { ascending: false }).limit(1),
    db.from("market_intel").select("risk_level, regime, geopolitical_risk").order("created_at", { ascending: false }).limit(1),
  ]);

  const profile = profileRes.data;
  const accounts = accountsRes.data ?? [];
  const trades = tradesRes.data ?? [];
  const memory = (memoryRes.data?.[0]?.metadata as any)?.userMemory ?? {};
  const intel = intelRes.data?.[0];
  const affBalance = (earningsRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  const name = memory.nickname ?? profile?.full_name ?? "Trader";
  const tier = profile?.subscription_tier ?? "free";
  const isPaying = profile?.subscription_active && tier !== "free";
  const hour = new Date().getHours();

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 86400000);
  const todayPnl = trades.filter(t => new Date(t.close_time) >= todayStart).reduce((s, t) => s + Number(t.profit), 0);
  const weekPnl = trades.filter(t => new Date(t.close_time) >= weekStart).reduce((s, t) => s + Number(t.profit), 0);
  const wr = trades.length > 0 ? Math.round((trades.filter(t => Number(t.profit) > 0).length / trades.length) * 100) : 0;

  const accs = accounts.map(a => {
    const buf = Number(a.current_equity) > 0 ? ((Number(a.current_equity) - Number(a.dd_limit)) / Number(a.current_equity) * 100) : 0;
    return { firm: a.firm_profile, eq: Number(a.current_equity), buf: Math.round(buf * 10) / 10, on: a.copier_active, why: a.copier_paused_reason };
  });

  // Build data string for AI
  const data = `User: ${name}, Tier: ${tier}, Paying: ${isPaying}, Hour: ${hour}, Page: ${page}
Accounts: ${accs.length > 0 ? accs.map(a => `${a.firm} $${a.eq.toLocaleString()} Buf:${a.buf}% Copier:${a.on ? "ON" : "OFF"}${a.why ? ` (${a.why})` : ""}`).join(" | ") : "KEINE"}
Today: ${todayPnl >= 0 ? "+" : ""}$${todayPnl.toFixed(0)}, Week: ${weekPnl >= 0 ? "+" : ""}$${weekPnl.toFixed(0)}, WR: ${wr}%, Trades: ${trades.length}
Affiliate: $${affBalance.toFixed(0)}, Market: ${intel?.regime ?? "?"} Risk:${intel?.risk_level ?? "?"} Geo:${intel?.geopolitical_risk ?? "?"}
Memory: Exp:${memory.tradingExperience ?? "?"} Goal:${memory.propFirmGoal ?? "?"} Mood:${memory.lastMood ?? "?"} Risk:${memory.riskAppetite ?? "?"}`;

  let greeting: string;

  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: `Du bist FORGE Mentor. Begrüße ${name} beim Login. Max 120 Wörter. Struktur:
1. Persönliche Begrüßung + wichtigste Zahl
2. Was seit letztem Mal passiert ist (2 Sätze)
3. 1 konkreter CTA der ihn zum HANDELN bringt

Wenn FREE USER: Motiviere zum Abo — zeig was er verpasst. Nicht aufdringlich.
Wenn COPIER PAUSIERT: Erkläre warum, beruhige, sag dass alles automatisch läuft.
Wenn PROFIT: Feiere! Dann "Auszahlen nicht vergessen."
Wenn VERLUST: "Der Shield hat X Threats geblockt. Ohne ihn wäre es schlimmer."
Wenn KEIN ACCOUNT: "In 3 Minuten ist dein Copier live. Ich führe dich durch."

Ton: Direkt, warm, kompetent. Wie ein Mentor der sich kümmert. Deutsch.`,
      messages: [{ role: "user", content: data }],
    });
    greeting = res.content[0].type === "text" ? res.content[0].text : `Hey ${name}!`;
  } catch {
    greeting = isPaying
      ? `Hey ${name}! ${todayPnl >= 0 ? `Heute: +$${todayPnl.toFixed(0)}` : "Dein Copier arbeitet."} Buffer: ${accs[0]?.buf ?? 0}%.`
      : `Hey ${name}! Dein Smart Copier wartet. Verbinde dein MT-Konto → 3 Minuten Setup.`;
  }

  return NextResponse.json({
    greeting, name, tier, isPaying,
    stats: { todayPnl: Math.round(todayPnl * 100) / 100, weekPnl: Math.round(weekPnl * 100) / 100, wr, accounts: accs, affBalance: Math.round(affBalance * 100) / 100 },
    market: intel ? { regime: intel.regime, risk: intel.risk_level } : null,
    copierAuto: accs.map(a => ({ firm: a.firm, active: a.on, reason: a.why })),
  });
}
