export const dynamic = "force-dynamic";
export const maxDuration = 60;
// ═══════════════════════════════════════════════════════════════
// TP1 RELOAD — Wenn TP1 getroffen und Preis zurueck am Entry:
// Neue 4-Split Order mit gleicher Lot-Groesse, TP1 als erstes Ziel.
// Auch wenn Trader "Re-Entry" schreibt → gleiches Verhalten.
// Max 1 Reload pro Signal-Gruppe.
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";

const log = (level: string, msg: string) =>
  console.log(`[${new Date().toISOString()}] [RELOAD] [${level}] ${msg}`);

function getDefaultSlDist(symbol: string): number {
  const sym = symbol.toUpperCase();
  if (/XAU|GOLD/.test(sym)) return 5;
  if (/JPY/.test(sym)) return 0.15;
  return 0.0015;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const metaApiToken = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  if (!metaApiToken) return NextResponse.json({ error: "No token" }, { status: 500 });

  const db = createSupabaseAdmin();
  const reloads: any[] = [];

  try {
    // News Check
    const { data: news } = await db.from("economic_calendar")
      .select("title").lte("event_time", new Date(Date.now() + 15 * 60000).toISOString())
      .gte("event_time", new Date().toISOString()).in("tier", [0, 1]);
    if ((news?.length || 0) > 0) {
      return NextResponse.json({ reloads: [], message: "News in 15min — kein Reload" });
    }

    const { data: allAccounts } = await db.from("slave_accounts").select("*");
    const accounts = (allAccounts || []).filter((a: any) => a.copier_active === true);
    if (!accounts?.length) return NextResponse.json({ reloads: [] });

    for (const account of accounts) {
      const accountId = account.metaapi_account_id;
      try {
        const posRes = await fetch(
          `${CLIENT_BASE}/users/current/accounts/${accountId}/positions`,
          { headers: { "auth-token": metaApiToken }, signal: AbortSignal.timeout(15000), cache: "no-store" }
        );
        if (!posRes.ok) continue;
        const positions = await posRes.json();
        if (!Array.isArray(positions)) continue;

        // Managed Positionen OHNE Reloads
        const originals = positions.filter(
          (p: any) => p.comment && (p.comment.startsWith("TG-Signal") || p.comment.startsWith("COPY-")) && !p.comment.includes("RELOAD")
        );
        // Existierende Reloads
        const existingReloads = positions.filter(
          (p: any) => p.comment?.includes("RELOAD")
        );

        // Gruppiere Originale nach Symbol+Richtung
        const groups = new Map<string, any[]>();
        for (const pos of originals) {
          const dir = pos.type?.replace("POSITION_TYPE_", "") || "?";
          const key = `${pos.symbol}-${dir}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(pos);
        }

        for (const [groupKey, groupPos] of groups) {
          if (!groupPos?.length) continue;
          const remaining = groupPos.length;
          const isBuy = groupPos[0].type === "POSITION_TYPE_BUY";
          const symbol = groupPos[0].symbol;
          const entry = groupPos[0].openPrice;
          const currentPrice = groupPos[0].currentPrice;
          const originalSL = groupPos[0].stopLoss;
          if (!entry || !currentPrice) continue;

          // Nur wenn TP1 hit (remaining < 4) und noch Positionen offen
          if (remaining >= 4 || remaining < 1) continue;

          // Schon ein Reload fuer dieses Symbol+Richtung?
          const hasReload = existingReloads.some(r => r.symbol === symbol && r.type === groupPos[0].type);
          if (hasReload) continue;

          // Preis muss zurueck im Entry-Zone sein (±$1.00 fuer Gold)
          const entryZone = /xau|gold/i.test(symbol) ? 1.0 : 0.002;
          const distFromEntry = isBuy ? currentPrice - entry : entry - currentPrice;

          // Entry-Zone: Preis innerhalb ±$1 vom Entry
          if (Math.abs(distFromEntry) > entryZone) continue;

          // Preis darf nicht zu weit GEGEN uns sein (max $2 unter Entry)
          const maxAdverse = /xau|gold/i.test(symbol) ? 2.0 : 0.004;
          if (distFromEntry < -maxAdverse) continue;

          // Trade muss mindestens 3 Min alt sein
          const ageMin = groupPos[0].time ? (Date.now() - new Date(groupPos[0].time).getTime()) / 60000 : 999;
          if (ageMin < 3) continue;

          // Momentum Check: Nicht alle 3 Kerzen GEGEN uns
          let momentumOk = true;
          try {
            const candleRes = await fetch(
              `${CLIENT_BASE}/users/current/accounts/${accountId}/historical-market-data/symbols/${encodeURIComponent(symbol)}/timeframes/5m/candles?limit=5`,
              { headers: { "auth-token": metaApiToken }, signal: AbortSignal.timeout(10000) }
            );
            if (candleRes.ok) {
              const candles = await candleRes.json();
              if (Array.isArray(candles) && candles.length >= 3) {
                const last3 = candles.slice(-3);
                const against = isBuy
                  ? last3.filter((c: any) => c.close < c.open).length
                  : last3.filter((c: any) => c.close > c.open).length;
                if (against >= 3) momentumOk = false; // Alle 3 gegen uns
              }
            }
          } catch {}
          if (!momentumOk) {
            log("INFO", `${account.mt_login} ${groupKey}: Momentum komplett AGAINST — kein Reload`);
            continue;
          }

          // === RELOAD ORDER ===
          // Gleiche Lot-Groesse wie die noch offenen Splits
          // 4 neue Split-Orders mit SL eng ($3 Gold) und TPs gestaffelt
          const oneR = originalSL ? Math.abs(entry - originalSL) : getDefaultSlDist(symbol);
          const reloadSL = isBuy ? entry - 3 : entry + 3; // $3 enger SL fuer Gold

          // TPs von den verbleibenden Positionen extrahieren
          const tps = groupPos
            .map((p: any) => p.takeProfit)
            .filter((tp: any) => tp && tp > 0)
            .sort((a: number, b: number) => isBuy ? a - b : b - a);

          // Lot-Groesse: Summe der verbleibenden Lots (gleiche Gesamtgroesse)
          const totalLots = groupPos.reduce((s: number, p: any) => s + (p.volume || 0), 0);
          const reloadLots = Math.max(0.01, Math.floor(totalLots * 100) / 100);

          // 4 Splits mit den TPs der verbleibenden Positionen
          const splits = [
            { pct: 0.40, tp: tps[0] || (isBuy ? entry + oneR * 1.5 : entry - oneR * 1.5), label: "TP1" },
            { pct: 0.25, tp: tps[1] || (isBuy ? entry + oneR * 2.5 : entry - oneR * 2.5), label: "TP2" },
            { pct: 0.20, tp: tps[2] || (isBuy ? entry + oneR * 3.5 : entry - oneR * 3.5), label: "TP3" },
            { pct: 0.15, tp: tps[3] || (isBuy ? entry + oneR * 5.0 : entry - oneR * 5.0), label: "Runner" },
          ];

          log("INFO", `${account.mt_login} ${groupKey}: RELOAD! ${remaining} Pos offen, Preis ${currentPrice} nah am Entry ${entry}`);

          let placed = 0;
          for (const split of splits) {
            const lots = Math.max(0.01, Math.floor(reloadLots * split.pct * 100) / 100);
            const actionType = isBuy ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";
            try {
              const res = await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, {
                method: "POST",
                headers: { "auth-token": metaApiToken, "Content-Type": "application/json" },
                body: JSON.stringify({
                  actionType, symbol, volume: lots,
                  stopLoss: Math.round(reloadSL * 100) / 100,
                  takeProfit: Math.round(split.tp * 100) / 100,
                  comment: `COPY-${split.label}-RELOAD`,
                }),
              });
              const result = await res.json();
              if (result.numericCode === 10009 || result.stringCode === "TRADE_RETCODE_DONE") {
                placed++;
              } else {
                log("WARN", `Reload ${split.label}: ${result.stringCode || result.message || "?"}`);
              }
              // Sequentiell mit kurzer Pause (verhindert INVALID_STOPS)
              await new Promise(r => setTimeout(r, 300));
            } catch (e: any) {
              log("WARN", `Reload ${split.label} Fehler: ${e.message}`);
            }
          }

          log("INFO", `${account.mt_login} ${groupKey}: RELOAD ${placed}/4 Orders (${reloadLots}L, SL ${reloadSL})`);
          reloads.push({
            account: account.mt_login, symbol, direction: isBuy ? "BUY" : "SELL",
            entry: currentPrice, lots: reloadLots, placed, remaining,
          });
        }
      } catch (err: any) {
        log("ERROR", `${account.mt_login}: ${err.message}`);
      }
    }

    return NextResponse.json({ reloads, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
