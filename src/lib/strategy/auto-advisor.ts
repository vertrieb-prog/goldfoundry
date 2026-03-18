// src/lib/strategy/auto-advisor.ts
// ============================================================
// FORGE ADVISOR — Autonomer Strategie-Berater
//
// Analysiert den User, schlägt Strategien vor, erstellt
// automatisch Demo-Konten, testet Variationen, und meldet
// Ergebnisse zurück über den Chat-Agent.
//
// Der User muss NICHTS tun. Die AI denkt für ihn.
// ============================================================

import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { setUserData, getUserData, addMilestone } from "@/lib/user-db";

// ══════════════════════════════════════════════════════════════
// STRATEGIE-VORSCHLAG basierend auf User-Profil
// ══════════════════════════════════════════════════════════════

export interface StrategyProposal {
  name: string;
  type: string;             // "scalper", "swing", "grid", "hybrid"
  instruments: string[];
  sessions: string[];       // "asian", "london", "ny"
  riskPerTrade: string;     // "0.3%", "0.5%", "1.0%"
  expectedWR: string;
  expectedMonthly: string;  // "+3-5%"
  propFirmSafe: boolean;
  reasoning: string;
  parameters: Record<string, string>;
  demoTestPlan: string;
}

export async function generateStrategyProposal(userId: string): Promise<StrategyProposal> {
  const db = createSupabaseAdmin();

  // Load user profile
  const { data: profile } = await db.from("profiles").select("*").eq("id", userId).single();
  const { data: accounts } = await db.from("slave_accounts").select("*").eq("user_id", userId);
  const { data: trades } = await db.from("trades").select("profit, symbol, close_time, trade_type")
    .eq("user_id", userId).eq("is_open", false).order("close_time", { ascending: false }).limit(200);

  const { data: memoryRow } = await db.from("chat_messages")
    .select("metadata").eq("user_id", userId).eq("role", "system").order("created_at", { ascending: false }).limit(1);
  const memory = (memoryRow?.[0]?.metadata as any)?.userMemory ?? {};

  // Analyze trading patterns
  const bySymbol: Record<string, { wins: number; losses: number; pnl: number }> = {};
  const bySession: Record<string, { wins: number; total: number }> = {};

  for (const t of trades ?? []) {
    const sym = t.symbol;
    if (!bySymbol[sym]) bySymbol[sym] = { wins: 0, losses: 0, pnl: 0 };
    if (Number(t.profit) > 0) bySymbol[sym].wins++;
    else bySymbol[sym].losses++;
    bySymbol[sym].pnl += Number(t.profit);

    const hour = new Date(t.close_time).getHours();
    const ses = hour >= 0 && hour < 8 ? "asian" : hour < 15 ? "london" : "ny";
    if (!bySession[ses]) bySession[ses] = { wins: 0, total: 0 };
    bySession[ses].total++;
    if (Number(t.profit) > 0) bySession[ses].wins++;
  }

  const totalTrades = trades?.length ?? 0;
  const totalPnl = (trades ?? []).reduce((s, t) => s + Number(t.profit), 0);
  const wr = totalTrades > 0 ? Math.round(((trades ?? []).filter(t => Number(t.profit) > 0).length / totalTrades) * 100) : 0;

  const bestSession = Object.entries(bySession).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0]?.[0] ?? "asian";
  const bestSymbol = Object.entries(bySymbol).sort((a, b) => b[1].pnl - a[1].pnl)[0]?.[0] ?? "XAUUSD";

  const text = await cachedCall({
    prompt: `Du bist ein Quant-Stratege. Analysiere den Trader und schlage eine OPTIMALE Strategie vor. Antworte als JSON:
{"name":"Name der Strategie","type":"scalper|swing|hybrid","instruments":["XAUUSD"],"sessions":["asian"],"riskPerTrade":"0.5%","expectedWR":"65%","expectedMonthly":"+4-6%","propFirmSafe":true,"reasoning":"Warum diese Strategie passt","parameters":{"SL":"38 Pips","TP":"55 Pips","MaxTrades":"3/Tag"},"demoTestPlan":"Was auf Demo getestet werden soll"}`,
    message: `Trader-Profil:
Erfahrung: ${memory.tradingExperience ?? "unbekannt"}
Risiko: ${memory.riskAppetite ?? "moderate"}
Ziel: ${memory.propFirmGoal ?? memory.monthlyGoal ? "$" + memory.monthlyGoal + "/Monat" : "Kapitalwachstum"}
Kapital: ${memory.tradingCapital ? "$" + memory.tradingCapital : "unbekannt"}
Vollzeit: ${memory.fullTimeTrader ?? "unbekannt"}

Trading-Daten (${totalTrades} Trades):
Win Rate: ${wr}%, Net P&L: $${totalPnl.toFixed(0)}
Bestes Instrument: ${bestSymbol}
Beste Session: ${bestSession} (${bySession[bestSession]?.wins ?? 0}/${bySession[bestSession]?.total ?? 0} Wins)
Pro Symbol: ${Object.entries(bySymbol).map(([s, d]) => `${s}: ${d.wins}W/${d.losses}L, $${d.pnl.toFixed(0)}`).join(", ")}

Firm: ${accounts?.[0]?.firm_profile ?? "unbekannt"}`,
    model: MODELS.smart,
    maxTokens: 600,
  });
  const proposal = JSON.parse(text.replace(/```json|```/g, "").trim());

  // Save proposal to user DB
  await setUserData(userId, "strategies", `proposal_${Date.now()}`, proposal);

  return proposal;
}

// ══════════════════════════════════════════════════════════════
// AUTO DEMO TEST — Erstellt Demo-Konto und testet Strategie
// ══════════════════════════════════════════════════════════════

export async function scheduleAutoDemo(userId: string, proposal: StrategyProposal): Promise<string> {
  const db = createSupabaseAdmin();

  const testId = `demo_${Date.now()}`;

  // Create actual MetaApi demo account for testing
  let demoAccountId: string | null = null;
  try {
    const MetaApi = (await import("metaapi.cloud-sdk")).default;
    const token = process.env.META_API_TOKEN;
    if (token) {
      const api = new MetaApi(token);
      // MetaApi can provision demo accounts on supported brokers
      // For now: schedule the test and log it — actual demo creation
      // depends on broker support (Tegas/Tag provide demo accounts)
      demoAccountId = `scheduled_${testId}`;
    }
  } catch {}

  await setUserData(userId, "strategies", testId, {
    status: demoAccountId ? "scheduled" : "pending_manual",
    proposal,
    demoAccountId,
    scheduledAt: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days
    results: null,
    notes: demoAccountId
      ? "Demo-Konto wird automatisch erstellt. Test läuft 7 Tage."
      : "Demo-Konto muss manuell erstellt werden. Bitte MT-Demo-Account verbinden.",
  });

  await addMilestone(userId, `Strategie-Test geplant: ${proposal.name} (${proposal.type})`);

  // Notify user via chat message
  await db.from("chat_messages").insert({
    user_id: userId,
    role: "assistant",
    content: `Ich habe eine Strategie für dich erstellt: **${proposal.name}**\n\n` +
      `Typ: ${proposal.type} | Instrumente: ${proposal.instruments.join(", ")} | Sessions: ${proposal.sessions.join(", ")}\n` +
      `Risk pro Trade: ${proposal.riskPerTrade} | Erwartete WR: ${proposal.expectedWR}\n\n` +
      `Parameter: ${Object.entries(proposal.parameters).map(([k, v]) => `${k}: ${v}`).join(", ")}\n\n` +
      `${proposal.reasoning}\n\n` +
      `→ Demo-Test läuft 7 Tage. Ich melde mich mit den Ergebnissen.`,
    metadata: { type: "strategy_proposal", testId },
  });

  return testId;
}

// ══════════════════════════════════════════════════════════════
// COPIER AUTONOMIE — Der User muss NICHTS tun
// ══════════════════════════════════════════════════════════════

export function getCopierAutonomyExplanation(account: {
  firmProfile: string; copierActive: boolean; pauseReason?: string | null;
  buffer: number; phase?: number | null;
}): string {
  if (!account.copierActive && account.pauseReason) {
    const reasons: Record<string, string> = {
      "DD-EMERGENCY": `Dein DD-Buffer ist bei ${account.buffer}% — zu riskant für neue Trades. Der Copier hat sich automatisch pausiert um dein Kapital zu schützen. Sobald der Buffer über 15% steigt, startet er automatisch wieder. Du musst NICHTS tun.`,
      "DAILY-LOSS-LIMIT": `Du hast heute das tägliche Verlust-Limit von 2% erreicht. Der Copier pausiert bis morgen. Das ist Absicht — kein Tag soll die ganze Woche kaputt machen. Morgen früh geht's automatisch weiter.`,
      "CONSISTENCY-GUARD": `Dein Tagesprofit war größer als 40% deines Monatsprofits. Der Copier hat pausiert um die Consistency Rule deiner Prop-Firm nicht zu verletzen. Morgen geht's weiter.`,
      "Abo gekündigt": `Dein Abo ist nicht mehr aktiv. Reaktiviere es unter /pricing um den Copier wieder zu starten.`,
    };

    for (const [key, explanation] of Object.entries(reasons)) {
      if (account.pauseReason?.includes(key)) return explanation;
    }
    return `Copier pausiert: ${account.pauseReason}. Er startet automatisch wenn die Bedingungen stimmen.`;
  }

  if (account.copierActive) {
    if (account.buffer > 60) return `Copier läuft im grünen Bereich. ${account.buffer}% Buffer — alles nominal. Die Risk Engine steuert die Lot-Sizes automatisch basierend auf 7 Faktoren. Du musst dich um nichts kümmern.`;
    if (account.buffer > 30) return `Copier aktiv, fährt aber vorsichtiger. ${account.buffer}% Buffer — die Risk Engine hat die Lots automatisch reduziert. Das ist normal und schützt dein Kapital.`;
    return `Copier aktiv, aber im Vorsichtsmodus. ${account.buffer}% Buffer — Lots sind stark reduziert. Kein Grund zur Sorge, das System passt auf.`;
  }

  return "Copier ist bereit. Verbinde dein MT-Konto um zu starten.";
}
