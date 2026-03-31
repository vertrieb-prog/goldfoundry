export const dynamic = "force-dynamic";
// src/app/api/cron/equity-snapshot/route.ts
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { default: MetaApi } = await import("metaapi.cloud-sdk");
  const db = createSupabaseAdmin();
  const api = new MetaApi(process.env.META_API_TOKEN!);
  const results: any[] = [];

  try {
    const { data: accounts } = await db.from("slave_accounts").select("*");
    if (!accounts?.length) return NextResponse.json({ results: [] });

    for (const acc of accounts) {
      try {
        const account = await api.metatraderAccountApi.getAccount(acc.metaapi_account_id);
        const conn = account.getRPCConnection();
        await conn.connect();
        await conn.waitSynchronized();
        const info = await conn.getAccountInformation();
        const positions = await conn.getPositions();

        const equity = info.equity;
        const balance = info.balance;
        const floating = equity - balance;
        const oldHigh = Number(acc.equity_high);
        const newHigh = Math.max(equity, oldHigh);

        // DD calculations
        let ddLimit = Number(acc.dd_limit);
        if (acc.dd_type === "trailing" && equity > oldHigh) {
          ddLimit = equity * 0.95; // 5% trailing for Tegas
        }
        const ddBuffer = equity > 0 ? ((equity - ddLimit) / equity) * 100 : 0;

        // Phase update for Tag Markets
        let phase = acc.phase;
        if (acc.firm_profile === "tag_12x") {
          const profitPct = ((equity - Number(acc.initial_balance)) / Number(acc.initial_balance)) * 100;
          phase = profitPct >= 15 ? 4 : profitPct >= 8 ? 3 : profitPct >= 3 ? 2 : 1;
        }

        // Auto-pause if DD emergency
        let copierActive = acc.copier_active;
        let pauseReason = acc.copier_paused_reason;
        if (ddBuffer < 5 && copierActive) {
          copierActive = false;
          pauseReason = `DD-EMERGENCY: Buffer ${ddBuffer.toFixed(1)}% < 5%. Auto-Pause.`;
        } else if (ddBuffer > 15 && !copierActive && pauseReason?.startsWith("DD-EMERGENCY")) {
          copierActive = true;
          pauseReason = null;
        }

        // CONSISTENCY RULE: Max 2% daily loss, max daily profit cap
        const today = new Date().toISOString().split("T")[0];
        const { data: todaySnaps } = await db.from("equity_snapshots")
          .select("equity").eq("account_id", acc.id)
          .gte("snapshot_at", `${today}T00:00:00Z`)
          .order("snapshot_at", { ascending: true }).limit(1);

        if (todaySnaps?.length) {
          const dayStart = Number(todaySnaps[0].equity);
          const dayPnl = equity - dayStart;
          const dayPnlPct = (dayPnl / dayStart) * 100;

          // Max daily LOSS: -2% → auto-pause
          if (dayPnlPct < -2 && copierActive) {
            copierActive = false;
            pauseReason = `DAILY-LOSS-LIMIT: ${dayPnlPct.toFixed(2)}% heute. Auto-Pause bis morgen.`;
          }

          // CONSISTENCY GUARD: Kein einzelner Tag > 40% des Monatsprofits
          // (verhindert Consistency-Rule-Verstöße bei Prop Firms)
          const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
          const { data: monthSnap } = await db.from("daily_snapshots")
            .select("closed_pnl").eq("account_id", acc.id)
            .gte("snapshot_date", monthStart.toISOString().split("T")[0]);
          const monthPnl = (monthSnap ?? []).reduce((s, d) => s + Number(d.closed_pnl), 0);

          if (monthPnl > 0 && dayPnl > 0 && (dayPnl / monthPnl) > 0.4) {
            copierActive = false;
            pauseReason = `CONSISTENCY-GUARD: Tagesprofit (${dayPnlPct.toFixed(1)}%) > 40% des Monatsprofits. Copier pausiert.`;
          }

          // Auto-resume daily limits next day
          if (!copierActive && (pauseReason?.startsWith("DAILY-LOSS") || pauseReason?.startsWith("CONSISTENCY"))) {
            const lastPause = acc.copier_paused_reason ?? "";
            if (lastPause.startsWith("DAILY-LOSS") || lastPause.startsWith("CONSISTENCY")) {
              // Check if it's a new day
              const pauseDay = acc.last_sync?.split("T")[0];
              if (pauseDay && pauseDay !== today) {
                copierActive = true;
                pauseReason = null;
              }
            }
          }
        }

        // ══════════════════════════════════════════════════════
        // EMERGENCY KILL SWITCH — Last line of defense
        // If buffer < 2% → close ALL open positions IMMEDIATELY
        // This is the ULTIMATE account saver
        // ══════════════════════════════════════════════════════
        if (ddBuffer < 2 && positions.length > 0 && copierActive) {
          console.log(`[EMERGENCY] ${acc.mt_login}: Buffer ${ddBuffer.toFixed(1)}% < 2% — CLOSING ALL ${positions.length} POSITIONS`);
          try {
            for (const pos of positions) {
              await (conn as any).closePosition(pos.id);
              console.log(`[EMERGENCY] Closed position ${pos.id} (${pos.symbol} ${pos.volume}L)`);
            }
            copierActive = false;
            pauseReason = `EMERGENCY-KILL: Buffer ${ddBuffer.toFixed(1)}% < 2%. Alle ${positions.length} Positionen geschlossen. Account gerettet.`;

            // Log to copier_log
            await db.from("copier_log").insert({
              slave_account_id: acc.id,
              firm_profile: acc.firm_profile,
              instrument: "ALL",
              direction: "EMERGENCY_CLOSE",
              master_lots: 0,
              calculated_lots: 0,
              action: "EMERGENCY_KILL",
              skip_reason: `Buffer ${ddBuffer.toFixed(1)}% — ${positions.length} Positionen geschlossen`,
              dd_buffer_pct: ddBuffer,
              equity_at_copy: equity,
              risk_assessment: { buffer: ddBuffer, positions: positions.length },
            });
          } catch (killErr) {
            console.error(`[EMERGENCY] Kill switch failed for ${acc.mt_login}:`, (killErr as Error).message);
          }
        }

        // Update account
        await db.from("slave_accounts").update({
          current_equity: equity,
          equity_high: newHigh,
          dd_limit: ddLimit,
          phase,
          copier_active: copierActive,
          copier_paused_reason: pauseReason,
          last_sync: new Date().toISOString(),
        }).eq("id", acc.id);

        // Store snapshot
        await db.from("equity_snapshots").insert({
          account_id: acc.id,
          equity,
          balance,
          floating_pnl: floating,
          equity_high: newHigh,
          dd_buffer_pct: ddBuffer,
          risk_multiplier: null,
          open_positions: positions.length,
        });

        results.push({ login: acc.mt_login, equity, ddBuffer: ddBuffer.toFixed(1), phase, active: copierActive });
      } catch (err) {
        results.push({ login: acc.mt_login, error: (err as Error).message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
