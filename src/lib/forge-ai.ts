// src/lib/forge-ai.ts
// ============================================================
// FORGE AI — System Prompt + Data Context Builder
// ============================================================

import { supabaseAdmin } from "@/lib/supabase-admin";

const FORGE_IDENTITY = `Du bist FORGE AI, die proprietäre Trading-Intelligence-Engine von Gold Foundry (goldfoundry.de).

PERSONA: Senior Quant Analyst + Prop-Firm Coach. 12 Jahre Erfahrung. XAUUSD und US500 Spezialist. Du denkst in Sharpe Ratios, R-Multiples und DD-Buffern.

STIMME: Direkt. Immer Zahlen. Trading-Vokabular. Bold für Kern, → für Data, ⚠️/✦/🔴 für Status. Deutsch default, Fachbegriffe Englisch.

FOCUS: NUR XAUUSD und US500. Prop-Firm Rules (Tegas 24x/5% Trailing, Tag 12x/10% Fixed).

BEI JEDER ANTWORT:
1. DD-Alarm ZUERST (wenn WARNING/CRITICAL)
2. Nach Instrument splitten
3. Copier-Status nennen
4. Challenge-Fortschritt wenn relevant
5. Konkrete Next Steps mit Zahlen

NIEMALS: Finanzberatung, Zukunftsgarantien, Risiko herunterspielen.`;

export async function buildForgeAIContext(userId: string): Promise<string> {
  const db = supabaseAdmin;

  // Parallel alle Daten laden
  const [
    accountsRes,
    recentTradesRes,
    copierRes,
    intelRes,
    calendarRes,
    snapshotsRes,
  ] = await Promise.all([
    db.from("slave_accounts").select("*").eq("user_id", userId),
    db.from("trades").select("*").eq("user_id", userId).order("close_time", { ascending: false }).limit(50),
    db.from("copier_log").select("*")
      .in("slave_account_id", (await db.from("slave_accounts").select("id").eq("user_id", userId)).data?.map(a => a.id) ?? [])
      .order("created_at", { ascending: false }).limit(20),
    db.from("market_intel").select("*").order("created_at", { ascending: false }).limit(1),
    db.from("economic_calendar").select("*").gte("event_time", new Date().toISOString()).order("event_time").limit(10),
    db.from("daily_snapshots").select("*")
      .in("account_id", (await db.from("slave_accounts").select("id").eq("user_id", userId)).data?.map(a => a.id) ?? [])
      .order("snapshot_date", { ascending: false }).limit(30),
  ]);

  const accounts = accountsRes.data ?? [];
  const trades = recentTradesRes.data ?? [];
  const copierLogs = copierRes.data ?? [];
  const intel = intelRes.data?.[0] ?? null;
  const calendar = calendarRes.data ?? [];
  const snapshots = snapshotsRes.data ?? [];

  // Kontext bauen
  let ctx = `\n## LIVE DATEN (${new Date().toISOString()})\n\n`;

  // Market Intel
  if (intel) {
    ctx += `### MARKET INTEL\n`;
    ctx += `Risk Level: ${intel.risk_level} (${intel.risk_score}/100)\n`;
    ctx += `Regime: ${intel.regime} | VIX: ${intel.vix_level} | DXY: ${intel.dxy_trend}\n`;
    ctx += `Geopolitik: ${intel.geopolitical_risk}\n`;
    if (intel.xauusd_atr) ctx += `XAUUSD ATR: ${intel.xauusd_atr} (Ratio: ${intel.xauusd_atr_ratio}) Bias: ${intel.xauusd_bias}\n`;
    if (intel.us500_atr) ctx += `US500 ATR: ${intel.us500_atr} (Ratio: ${intel.us500_atr_ratio}) Bias: ${intel.us500_bias}\n`;
    if (intel.forecast_text) ctx += `Forecast: ${intel.forecast_text}\n`;
    ctx += `\n`;
  }

  // Upcoming Events
  if (calendar.length > 0) {
    ctx += `### NÄCHSTE EVENTS\n`;
    for (const ev of calendar.slice(0, 5)) {
      ctx += `→ ${ev.event_time}: ${ev.title} (${ev.currency}, ${ev.impact}, Tier ${ev.tier})\n`;
    }
    ctx += `\n`;
  }

  // Accounts
  if (accounts.length > 0) {
    ctx += `### ACCOUNTS\n`;
    for (const acc of accounts) {
      const ddBuf = acc.current_equity > 0 ? ((acc.current_equity - acc.dd_limit) / acc.current_equity * 100).toFixed(1) : "0";
      const status = Number(ddBuf) > 70 ? "NOMINAL ✦" : Number(ddBuf) > 40 ? "CAUTION ⚡" : Number(ddBuf) > 20 ? "WARNING ⚠️" : "CRITICAL 🔴";
      ctx += `\n**${acc.firm_profile.toUpperCase()}** (${acc.mt_login}@${acc.broker_server})\n`;
      ctx += `Balance: $${Number(acc.current_equity).toFixed(2)} | DD-Limit: $${Number(acc.dd_limit).toFixed(2)}\n`;
      ctx += `DD-Buffer: ${ddBuf}% → ${status}\n`;
      ctx += `DD-Typ: ${acc.dd_type} | Phase: ${acc.phase ?? "N/A"} | Copier: ${acc.copier_active ? "AKTIV" : "PAUSIERT"}\n`;
      if (acc.copier_paused_reason) ctx += `Pause-Grund: ${acc.copier_paused_reason}\n`;
    }
    ctx += `\n`;
  }

  // Letzte Trades
  if (trades.length > 0) {
    const closedTrades = trades.filter(t => !t.is_open);
    const openTrades = trades.filter(t => t.is_open);

    if (openTrades.length > 0) {
      ctx += `### OFFENE POSITIONEN (${openTrades.length})\n`;
      for (const t of openTrades) {
        ctx += `→ ${t.symbol} ${t.trade_type} ${t.volume}L | Open: ${t.open_price} | P&L: $${Number(t.profit).toFixed(2)}\n`;
      }
      ctx += `\n`;
    }

    if (closedTrades.length > 0) {
      ctx += `### LETZTE TRADES (${Math.min(closedTrades.length, 20)})\n`;
      const winners = closedTrades.filter(t => Number(t.net_profit) > 0);
      const totalPnl = closedTrades.reduce((s, t) => s + Number(t.net_profit), 0);
      const wr = closedTrades.length > 0 ? (winners.length / closedTrades.length * 100).toFixed(1) : "0";
      ctx += `Gesamt: ${closedTrades.length} Trades | WR: ${wr}% | Net P&L: $${totalPnl.toFixed(2)}\n`;

      // Instrument-Split
      const bySymbol: Record<string, typeof closedTrades> = {};
      for (const t of closedTrades) {
        if (!bySymbol[t.symbol]) bySymbol[t.symbol] = [];
        bySymbol[t.symbol].push(t);
      }
      for (const [sym, symTrades] of Object.entries(bySymbol)) {
        const symWins = symTrades.filter(t => Number(t.net_profit) > 0);
        const symPnl = symTrades.reduce((s, t) => s + Number(t.net_profit), 0);
        ctx += `→ ${sym}: ${symTrades.length}T, WR ${(symWins.length / symTrades.length * 100).toFixed(0)}%, P&L $${symPnl.toFixed(2)}\n`;
      }

      // Letzte 5 einzeln
      ctx += `\nLetzte 5:\n`;
      for (const t of closedTrades.slice(0, 5)) {
        ctx += `  ${t.symbol} ${t.trade_type} ${t.volume}L → $${Number(t.net_profit).toFixed(2)} | ${t.close_time}\n`;
      }
      ctx += `\n`;
    }
  }

  // Copier Status
  if (copierLogs.length > 0) {
    ctx += `### COPIER LOG (letzte ${Math.min(copierLogs.length, 10)})\n`;
    const copied = copierLogs.filter(l => l.action === "COPIED").length;
    const skipped = copierLogs.filter(l => l.action === "SKIPPED").length;
    ctx += `Kopiert: ${copied} | Geskippt: ${skipped}\n`;
    for (const log of copierLogs.slice(0, 5)) {
      ctx += `→ ${log.instrument} ${log.direction} | ${log.action} | Lots: ${log.calculated_lots ?? 0} | DD-Buffer: ${Number(log.dd_buffer_pct).toFixed(1)}%`;
      if (log.skip_reason) ctx += ` | Grund: ${log.skip_reason}`;
      ctx += `\n`;
    }
  }

  return ctx;
}

export function buildSystemPrompt(dataContext: string): string {
  return `${FORGE_IDENTITY}\n\n${dataContext}\n\nAnalysiere die Daten sofort. DD-Alarm zuerst. Immer nach Instrument splitten.`;
}
