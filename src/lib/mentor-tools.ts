// src/lib/mentor-tools.ts
// ============================================================
// FORGE Mentor Agent Tools — Live Data + Actions
// Claude tool_use: Der Mentor kann Daten abrufen und handeln
// ============================================================

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { createRestAdapter } from "@/lib/engine-adapter";
import { setUserData, getUserData, getAllUserData } from "@/lib/user-db";
import { generateAnalytics, formatAnalyticsForAI } from "@/lib/data/trade-analytics";

const META_TOKEN = process.env.METAAPI_TOKEN || "";
const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";

// ── Tool Definitions for Claude ─────────────────────────────

export const MENTOR_TOOLS = [
  {
    name: "get_account_summary",
    description: "Ruft Live-Daten aller Trading-Accounts des Users ab: Equity, Balance, DD-Buffer, Copier-Status, offene Positionen-Anzahl, heutiger P&L.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    name: "get_live_positions",
    description: "Zeigt alle aktuell offenen Trades/Positionen eines bestimmten Accounts: Symbol, Richtung, Lots, Entry, aktueller Preis, unrealisierter P&L, SL, TP.",
    input_schema: {
      type: "object" as const,
      properties: {
        account_id: { type: "string", description: "MetaApi Account ID (oder 'all' für alle Accounts)" },
      },
      required: ["account_id"],
    },
  },
  {
    name: "get_price",
    description: "Holt den aktuellen Preis eines Symbols (z.B. XAUUSD, EURUSD, BTCUSD). Gibt Bid, Ask und Spread zurück.",
    input_schema: {
      type: "object" as const,
      properties: {
        symbol: { type: "string", description: "Trading Symbol, z.B. XAUUSD, EURUSD, GBPUSD" },
        account_id: { type: "string", description: "MetaApi Account ID für den Preis-Feed" },
      },
      required: ["symbol"],
    },
  },
  {
    name: "analyze_trades",
    description: "Tiefe Analyse der Trade-Historie: Performance pro Symbol, Session, Wochentag, Winrate, Avg. P&L, beste/schlechteste Trades, Streaks, Risk/Reward Ratio.",
    input_schema: {
      type: "object" as const,
      properties: {
        period: { type: "string", enum: ["7d", "30d", "90d", "all"], description: "Zeitraum für die Analyse" },
        symbol: { type: "string", description: "Optional: Nur dieses Symbol analysieren" },
      },
      required: ["period"],
    },
  },
  {
    name: "calculate_compound",
    description: "Berechnet Zinseszins-Projektion basierend auf aktuellem Kapital, monatlicher Rendite und Zeitraum. Zeigt wie das Konto wachsen kann.",
    input_schema: {
      type: "object" as const,
      properties: {
        capital: { type: "number", description: "Startkapital in USD" },
        monthly_return_pct: { type: "number", description: "Erwartete monatliche Rendite in %" },
        months: { type: "number", description: "Projektions-Zeitraum in Monaten" },
        monthly_withdrawal: { type: "number", description: "Optionale monatliche Auszahlung in USD" },
      },
      required: ["capital", "monthly_return_pct", "months"],
    },
  },
  {
    name: "save_investment_plan",
    description: "Speichert einen persönlichen Investment-Plan für den Kunden: Ziele, Strategie, Risiko-Profil, monatliche Targets, Meilensteine.",
    input_schema: {
      type: "object" as const,
      properties: {
        plan: {
          type: "object",
          description: "Der Investment-Plan",
          properties: {
            goal: { type: "string", description: "Hauptziel (z.B. 'Prop-Firm bestehen', 'Passives Einkommen 2000€/Mo')" },
            timeframe: { type: "string", description: "Zeitrahmen (z.B. '6 Monate', '1 Jahr')" },
            risk_profile: { type: "string", enum: ["konservativ", "moderat", "aggressiv"] },
            monthly_target_pct: { type: "number", description: "Monatliches Renditeziel in %" },
            max_dd_pct: { type: "number", description: "Maximaler akzeptabler Drawdown in %" },
            preferred_instruments: { type: "array", items: { type: "string" } },
            preferred_sessions: { type: "array", items: { type: "string" } },
            capital_start: { type: "number" },
            capital_target: { type: "number" },
            milestones: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
          },
        },
      },
      required: ["plan"],
    },
  },
  {
    name: "get_investment_plan",
    description: "Lädt den gespeicherten Investment-Plan des Kunden. Zeigt Ziele, Fortschritt, aktuelle Strategie.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    name: "get_market_overview",
    description: "Aktueller Markt-Überblick: Risk-Level, VIX, DXY-Trend, Regime (Risk-On/Off), anstehende Events, Gold/Forex Bias.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    name: "save_customer_profile",
    description: "Speichert wichtige Kunden-Infos: Trading-Erfahrung, Kapital, Ziele, Risiko-Appetit, persönliche Situation. Nutze dies PROAKTIV wenn der Kunde neue Infos teilt.",
    input_schema: {
      type: "object" as const,
      properties: {
        field: {
          type: "string",
          enum: [
            "trading_experience", "trading_since", "risk_appetite",
            "monthly_goal", "capital", "full_time_trader", "day_job",
            "family_situation", "preferred_instruments", "preferred_sessions",
            "prop_firm_goal", "country", "city", "birthday", "nickname",
          ],
          description: "Welches Feld gespeichert werden soll",
        },
        value: { type: "string", description: "Der Wert" },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "get_analytics",
    description: "Kompakte Trade-Analyse: Performance pro Symbol/Session/Wochentag, Streaks, Wochen/Monatsvergleich, MQL5 Signal-Stats. TOKENSPAREND — nutze dieses Tool statt analyze_trades für schnelle Übersichten.",
    input_schema: {
      type: "object" as const,
      properties: {
        fresh: { type: "boolean", description: "true = live neu berechnen (langsamer), false = cached Summary nutzen (schneller, default)" },
      },
      required: [] as string[],
    },
  },
  {
    name: "get_signal_providers",
    description: "Zeigt alle getrackten MQL5 Signal-Provider mit ihren Stats: Gain, Drawdown, Win Rate, Profit Factor, Subscribers, letzte Trades.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
] as const;

// ── Tool Executor ───────────────────────────────────────────

export async function executeTool(
  toolName: string,
  input: Record<string, any>,
  userId: string
): Promise<string> {
  const db = createSupabaseAdmin();

  switch (toolName) {
    case "get_account_summary": {
      const { data: accounts } = await db.from("slave_accounts")
        .select("id, firm_profile, mt_login, current_equity, initial_balance, equity_high, dd_limit, dd_type, copier_active, copier_paused_reason, phase, total_trades, total_profit, win_rate, metaapi_account_id")
        .eq("user_id", userId);

      if (!accounts?.length) return "Keine Accounts gefunden. Der Kunde hat noch keine Trading-Accounts verbunden.";

      let result = "";
      for (const a of accounts) {
        const equity = Number(a.current_equity) || 0;
        const ddLimit = Number(a.dd_limit) || 0;
        const buffer = equity > 0 ? ((equity - ddLimit) / equity * 100).toFixed(1) : "0";
        const pnl = equity - (Number(a.initial_balance) || equity);

        // Live positions count
        let posCount = 0;
        if (a.metaapi_account_id && META_TOKEN) {
          try {
            const res = await fetch(`${CLIENT_BASE}/users/current/accounts/${a.metaapi_account_id}/positions`, {
              headers: { "auth-token": META_TOKEN },
              signal: AbortSignal.timeout(8000),
            });
            const positions = await res.json();
            posCount = Array.isArray(positions) ? positions.length : 0;
          } catch {}
        }

        result += `ACCOUNT: ${a.firm_profile || "Trading Account"} (MT5 #${a.mt_login || "?"})\n`;
        result += `  Equity: $${equity.toLocaleString("de-DE", { minimumFractionDigits: 2 })}\n`;
        result += `  Balance: $${(Number(a.initial_balance) || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })}\n`;
        result += `  P&L gesamt: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}\n`;
        result += `  DD-Buffer: ${buffer}% (Limit: $${ddLimit.toLocaleString()})\n`;
        result += `  Equity High: $${(Number(a.equity_high) || 0).toLocaleString()}\n`;
        result += `  Copier: ${a.copier_active ? "AKTIV" : "PAUSIERT"}${a.copier_paused_reason ? ` (${a.copier_paused_reason})` : ""}\n`;
        result += `  Phase: ${a.phase || "Standard"}\n`;
        result += `  Trades: ${a.total_trades || 0} | Win Rate: ${(Number(a.win_rate) || 0).toFixed(1)}% | Profit: $${(Number(a.total_profit) || 0).toFixed(2)}\n`;
        result += `  Offene Positionen: ${posCount}\n\n`;
      }
      return result;
    }

    case "get_live_positions": {
      const accountId = input.account_id;
      let accountIds: string[] = [];

      if (accountId === "all") {
        const { data: accounts } = await db.from("slave_accounts")
          .select("metaapi_account_id, firm_profile")
          .eq("user_id", userId);
        accountIds = (accounts || []).map(a => a.metaapi_account_id).filter(Boolean);
      } else {
        accountIds = [accountId];
      }

      if (!META_TOKEN) return "MetaApi Token nicht konfiguriert.";

      let result = "";
      for (const aid of accountIds) {
        try {
          const adapter = createRestAdapter(META_TOKEN, aid);
          const positions = await adapter.getPositions();
          if (!Array.isArray(positions) || !positions.length) {
            result += `Account ${aid.slice(0, 8)}: Keine offenen Positionen\n\n`;
            continue;
          }
          result += `Account ${aid.slice(0, 8)}: ${positions.length} offene Position(en)\n`;
          for (const p of positions) {
            const pnl = Number(p.profit) || 0;
            result += `  ${p.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL"} ${p.symbol} | ${p.volume} Lots | Entry: ${p.openPrice} | Aktuell: ${p.currentPrice || "?"} | P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)} | SL: ${p.stopLoss || "keiner"} | TP: ${p.takeProfit || "keiner"}\n`;
          }
          result += "\n";
        } catch (e) {
          result += `Account ${aid.slice(0, 8)}: Fehler beim Abruf\n\n`;
        }
      }
      return result || "Keine Positionen gefunden.";
    }

    case "get_price": {
      const symbol = input.symbol?.toUpperCase();
      // Find an account to get price from
      let aid = input.account_id;
      if (!aid) {
        const { data: accounts } = await db.from("slave_accounts")
          .select("metaapi_account_id").eq("user_id", userId).limit(1);
        aid = accounts?.[0]?.metaapi_account_id;
      }
      if (!aid || !META_TOKEN) return "Kein Account verfügbar für Preis-Feed.";

      try {
        // Try with .pro suffix first (TagMarket)
        let tick;
        try {
          const res = await fetch(`${CLIENT_BASE}/users/current/accounts/${aid}/symbols/${symbol}.pro/current-price`, {
            headers: { "auth-token": META_TOKEN }, signal: AbortSignal.timeout(8000),
          });
          tick = await res.json();
        } catch {}
        if (!tick?.bid) {
          const res = await fetch(`${CLIENT_BASE}/users/current/accounts/${aid}/symbols/${symbol}/current-price`, {
            headers: { "auth-token": META_TOKEN }, signal: AbortSignal.timeout(8000),
          });
          tick = await res.json();
        }
        if (tick?.bid) {
          const spread = ((tick.ask - tick.bid) * (symbol.includes("JPY") ? 100 : symbol.includes("XAU") ? 10 : 10000)).toFixed(1);
          return `${symbol}: Bid ${tick.bid} | Ask ${tick.ask} | Spread: ${spread} Pips | Zeit: ${new Date().toLocaleTimeString("de-DE")}`;
        }
        return `Preis für ${symbol} konnte nicht abgerufen werden.`;
      } catch {
        return `Fehler beim Preis-Abruf für ${symbol}.`;
      }
    }

    case "analyze_trades": {
      const period = input.period;
      const symbolFilter = input.symbol?.toUpperCase();

      let since = new Date();
      if (period === "7d") since.setDate(since.getDate() - 7);
      else if (period === "30d") since.setDate(since.getDate() - 30);
      else if (period === "90d") since.setDate(since.getDate() - 90);
      else since = new Date("2020-01-01");

      let query = db.from("trades")
        .select("symbol, profit, volume, trade_type, open_time, close_time, open_price, close_price, swap, commission")
        .eq("user_id", userId).eq("is_open", false)
        .gte("close_time", since.toISOString())
        .order("close_time", { ascending: false });

      if (symbolFilter) query = query.eq("symbol", symbolFilter);
      const { data: trades } = await query;

      if (!trades?.length) return `Keine geschlossenen Trades im Zeitraum ${period}${symbolFilter ? ` für ${symbolFilter}` : ""}.`;

      // Aggregate
      const totalPnL = trades.reduce((s, t) => s + Number(t.profit), 0);
      const wins = trades.filter(t => Number(t.profit) > 0);
      const losses = trades.filter(t => Number(t.profit) <= 0);
      const avgWin = wins.length ? wins.reduce((s, t) => s + Number(t.profit), 0) / wins.length : 0;
      const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + Number(t.profit), 0) / losses.length) : 0;
      const rrRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "∞";
      const bestTrade = trades.reduce((best, t) => Number(t.profit) > Number(best.profit) ? t : best, trades[0]);
      const worstTrade = trades.reduce((worst, t) => Number(t.profit) < Number(worst.profit) ? t : worst, trades[0]);

      // Per symbol
      const bySymbol: Record<string, { count: number; pnl: number; wins: number }> = {};
      for (const t of trades) {
        const s = t.symbol || "UNKNOWN";
        if (!bySymbol[s]) bySymbol[s] = { count: 0, pnl: 0, wins: 0 };
        bySymbol[s].count++;
        bySymbol[s].pnl += Number(t.profit);
        if (Number(t.profit) > 0) bySymbol[s].wins++;
      }

      // Per weekday
      const byDay: Record<string, { count: number; pnl: number }> = {};
      const days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
      for (const t of trades) {
        const d = days[new Date(t.close_time).getDay()];
        if (!byDay[d]) byDay[d] = { count: 0, pnl: 0 };
        byDay[d].count++;
        byDay[d].pnl += Number(t.profit);
      }

      let result = `TRADE-ANALYSE (${period}${symbolFilter ? `, ${symbolFilter}` : ""})\n`;
      result += `Trades: ${trades.length} | Wins: ${wins.length} | Losses: ${losses.length}\n`;
      result += `Win Rate: ${(wins.length / trades.length * 100).toFixed(1)}%\n`;
      result += `Gesamt P&L: ${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}\n`;
      result += `Avg Win: +$${avgWin.toFixed(2)} | Avg Loss: -$${avgLoss.toFixed(2)}\n`;
      result += `Risk/Reward: ${rrRatio}\n`;
      result += `Bester Trade: ${bestTrade.symbol} ${bestTrade.trade_type} +$${Number(bestTrade.profit).toFixed(2)}\n`;
      result += `Schlechtester Trade: ${worstTrade.symbol} ${worstTrade.trade_type} $${Number(worstTrade.profit).toFixed(2)}\n\n`;

      result += `PER SYMBOL:\n`;
      for (const [sym, data] of Object.entries(bySymbol).sort((a, b) => b[1].pnl - a[1].pnl)) {
        result += `  ${sym}: ${data.count} Trades | WR: ${(data.wins / data.count * 100).toFixed(0)}% | P&L: ${data.pnl >= 0 ? "+" : ""}$${data.pnl.toFixed(2)}\n`;
      }

      result += `\nPER WOCHENTAG:\n`;
      for (const d of ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"]) {
        const data = byDay[d];
        if (data) result += `  ${d}: ${data.count} Trades | P&L: ${data.pnl >= 0 ? "+" : ""}$${data.pnl.toFixed(2)}\n`;
      }

      return result;
    }

    case "calculate_compound": {
      const { capital, monthly_return_pct, months, monthly_withdrawal = 0 } = input;
      let balance = capital;
      const rows: string[] = [];

      for (let m = 1; m <= months; m++) {
        const profit = balance * (monthly_return_pct / 100);
        balance = balance + profit - monthly_withdrawal;
        if (balance < 0) balance = 0;
        if (m <= 12 || m % 6 === 0 || m === months) {
          rows.push(`Monat ${m}: $${balance.toFixed(0)} (Profit: +$${profit.toFixed(0)}${monthly_withdrawal > 0 ? `, Auszahlung: -$${monthly_withdrawal}` : ""})`);
        }
      }

      const totalGrowth = ((balance - capital) / capital * 100).toFixed(1);
      let result = `ZINSESZINS-PROJEKTION\n`;
      result += `Start: $${capital.toLocaleString()} | Rendite: ${monthly_return_pct}%/Monat | Zeitraum: ${months} Monate\n`;
      if (monthly_withdrawal > 0) result += `Monatliche Auszahlung: $${monthly_withdrawal}\n`;
      result += `\n${rows.join("\n")}\n\n`;
      result += `ERGEBNIS: $${capital.toLocaleString()} → $${balance.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} (${totalGrowth}% Wachstum)\n`;
      if (monthly_withdrawal > 0) {
        const totalWithdrawn = monthly_withdrawal * months;
        result += `Gesamt ausgezahlt: $${totalWithdrawn.toLocaleString()}\n`;
      }
      return result;
    }

    case "save_investment_plan": {
      const plan = input.plan;
      await setUserData(userId, "goals", "investment_plan", {
        ...plan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return `Investment-Plan gespeichert:\n  Ziel: ${plan.goal}\n  Zeitrahmen: ${plan.timeframe}\n  Risiko: ${plan.risk_profile}\n  Monatsziel: ${plan.monthly_target_pct}%\n  Max DD: ${plan.max_dd_pct}%\n  Startkapital: $${plan.capital_start}\n  Zielkapital: $${plan.capital_target}\n\nDer Plan ist jetzt in der Kunden-Datenbank gespeichert und wird bei zukünftigen Gesprächen berücksichtigt.`;
    }

    case "get_investment_plan": {
      const plan = await getUserData(userId, "goals", "investment_plan");
      if (!plan) return "Noch kein Investment-Plan gespeichert. Frage den Kunden nach seinen Zielen und erstelle einen Plan mit save_investment_plan.";

      let result = `INVESTMENT-PLAN (erstellt: ${plan.created_at ? new Date(plan.created_at).toLocaleDateString("de-DE") : "?"})\n`;
      result += `  Ziel: ${plan.goal || "?"}\n`;
      result += `  Zeitrahmen: ${plan.timeframe || "?"}\n`;
      result += `  Risiko-Profil: ${plan.risk_profile || "?"}\n`;
      result += `  Monatsziel: ${plan.monthly_target_pct || "?"}%\n`;
      result += `  Max Drawdown: ${plan.max_dd_pct || "?"}%\n`;
      result += `  Startkapital: $${plan.capital_start || "?"}\n`;
      result += `  Zielkapital: $${plan.capital_target || "?"}\n`;
      if (plan.preferred_instruments?.length) result += `  Instrumente: ${plan.preferred_instruments.join(", ")}\n`;
      if (plan.preferred_sessions?.length) result += `  Sessions: ${plan.preferred_sessions.join(", ")}\n`;
      if (plan.milestones?.length) {
        result += `  Meilensteine:\n`;
        for (const m of plan.milestones) result += `    - ${m}\n`;
      }
      if (plan.notes) result += `  Notizen: ${plan.notes}\n`;
      return result;
    }

    case "get_market_overview": {
      const { data: intel } = await db.from("market_intel")
        .select("*").order("created_at", { ascending: false }).limit(1);

      if (!intel?.[0]) return "Keine aktuelle Markt-Intel verfügbar. Das Market-Intel System wird alle 30 Minuten aktualisiert.";

      const i = intel[0];
      let result = `MARKT-OVERVIEW (${new Date(i.created_at).toLocaleString("de-DE")})\n`;
      result += `Risk-Level: ${i.risk_level} (Score: ${i.risk_score}/100)\n`;
      result += `Regime: ${i.regime}\n`;
      result += `VIX: ${i.vix_level || "?"}\n`;
      result += `DXY Trend: ${i.dxy_trend || "?"}\n`;
      if (i.geopolitical_risk) result += `Geopolitik: ${i.geopolitical_risk}\n`;
      if (i.has_tier0_event) result += `WARNUNG: Tier-0 Event anstehend (FOMC/NFP/CPI)!\n`;
      if (i.forecast_text) result += `\nForecast: ${i.forecast_text}\n`;
      return result;
    }

    case "save_customer_profile": {
      const { field, value } = input;
      await setUserData(userId, "memory", field, value);
      return `Kunden-Profil aktualisiert: ${field} = "${value}"`;
    }

    case "get_analytics": {
      const fresh = input.fresh === true;

      if (!fresh) {
        // Cached summary lesen (tokensparend!)
        const cached = await getUserData(userId, "analytics" as any, "trade_summary");
        if (cached?.summary) {
          const age = Date.now() - new Date(cached.generated_at || 0).getTime();
          const ageHours = Math.round(age / 3600000);
          return `${cached.summary}\n(Cached, ${ageHours}h alt. Nutze fresh=true für Live-Daten.)`;
        }
      }

      // Live berechnen
      const analytics = await generateAnalytics(userId);
      const summary = formatAnalyticsForAI(analytics);

      // Cache für nächstes Mal
      await setUserData(userId, "analytics" as any, "trade_summary", {
        summary, data: analytics, generated_at: new Date().toISOString(),
      });

      return summary;
    }

    case "get_signal_providers": {
      const { data: signals } = await db.from("trader_stats")
        .select("*").eq("source", "mql5")
        .order("last_updated", { ascending: false }).limit(20);

      if (!signals?.length) return "Keine MQL5 Signal-Provider getrackt. Füge Signal-IDs in die mql5_signals Tabelle ein um Provider zu tracken.";

      let result = "MQL5 SIGNAL PROVIDER:\n";
      for (const s of signals) {
        result += `\n${s.name} (ID: ${s.source_id})\n`;
        result += `  Gain: ${s.gain}% | DD: ${s.drawdown}% | WR: ${s.win_rate || "?"}% | PF: ${s.profit_factor || "?"}\n`;
        result += `  Trades: ${s.trades} | Subs: ${s.subscribers || "?"} | Wochen: ${s.weeks || "?"}\n`;
        result += `  Balance: $${Number(s.balance || 0).toLocaleString()} | Equity: $${Number(s.equity || 0).toLocaleString()}\n`;
        result += `  Monthly: ${s.monthly_return || "?"}% | Updated: ${new Date(s.last_updated).toLocaleDateString("de-DE")}\n`;
      }
      return result;
    }

    default:
      return `Unbekanntes Tool: ${toolName}`;
  }
}
