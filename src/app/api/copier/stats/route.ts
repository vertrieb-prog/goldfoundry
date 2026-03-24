export const dynamic = "force-dynamic";
// ═══════════════════════════════════════════════════════════════
// User-facing: Smart Copier Performance Stats
// Zeigt jedem User seine persönliche Copier-Performance
// inkl. Kapitalschutz und Smart-Order-Vorteil
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const db = createSupabaseAdmin();

    // User's signals
    const { data: signals } = await db
      .from("telegram_signals")
      .select("status, parsed, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    // User's accounts
    const { data: accounts } = await db
      .from("slave_accounts")
      .select("current_equity, initial_balance, total_trades, total_profit, win_rate")
      .eq("user_id", user.id);

    const executed = (signals || []).filter((s: any) => s.status === "executed");
    const blocked = (signals || []).filter((s: any) =>
      ["low_confidence", "risk_blocked", "rejected_no_sl", "unparsed"].includes(s.status)
    );

    // Calculate capital protection
    let capitalProtected = 0;
    let signalsWithoutSL = 0;
    let lowConfidence = 0;
    let riskBlocked = 0;

    for (const s of blocked) {
      const p = s.parsed as any;
      if (!p) continue;

      if (s.status === "rejected_no_sl") {
        signalsWithoutSL++;
        capitalProtected += 350; // Average loss without SL
      } else if (s.status === "low_confidence") {
        lowConfidence++;
        if (p.stopLoss && p.entryPrice) {
          capitalProtected += Math.abs(p.entryPrice - p.stopLoss) * 0.6 * 0.05;
        } else {
          capitalProtected += 100;
        }
      } else if (s.status === "risk_blocked") {
        riskBlocked++;
        capitalProtected += 200;
      }
    }

    // Smart Order advantage
    let smartAdvantage = 0;
    for (const s of executed) {
      const p = s.parsed as any;
      if (!p?.entryPrice || !p?.stopLoss || !p?.takeProfits?.length) continue;

      const tps = p.takeProfits;
      const tp1 = Math.abs(tps[0] - p.entryPrice);
      const tp2 = tps[1] ? Math.abs(tps[1] - p.entryPrice) : tp1 * 1.5;
      const pipValue = p.symbol === "XAUUSD" ? 1 : 10;
      const lots = 0.05;

      // Extra from split TPs vs single TP1
      const singleProfit = tp1 * pipValue * lots;
      const splitProfit = (tp1 * 0.4 + tp2 * 0.25 + tp1 * 2 * 0.2 + tp1 * 2.5 * 0.15) * pipValue * lots;
      smartAdvantage += Math.max(0, splitProfit - singleProfit);
    }

    // Account totals
    const totalEquity = (accounts || []).reduce((s: number, a: any) => s + Number(a.current_equity || 0), 0);
    const totalInitial = (accounts || []).reduce((s: number, a: any) => s + Number(a.initial_balance || 0), 0);
    const totalProfit = (accounts || []).reduce((s: number, a: any) => s + Number(a.total_profit || 0), 0);
    const avgWinRate = (accounts || []).length > 0
      ? (accounts || []).reduce((s: number, a: any) => s + Number(a.win_rate || 0), 0) / accounts!.length
      : 0;

    return NextResponse.json({
      overview: {
        totalSignals: (signals || []).length,
        signalsExecuted: executed.length,
        signalsBlocked: blocked.length,
        accountCount: (accounts || []).length,
        totalEquity: Math.round(totalEquity),
        totalProfit: Math.round(totalProfit),
        winRate: Math.round(avgWinRate),
      },
      capitalProtection: {
        totalProtected: Math.round(capitalProtected),
        signalsWithoutSL: signalsWithoutSL,
        lowConfidence: lowConfidence,
        riskBlocked: riskBlocked,
        totalBlocked: blocked.length,
      },
      smartOrders: {
        advantage: Math.round(smartAdvantage),
        features: [
          { name: "4-Split TPs", desc: "Gewinne maximiert durch gestaffelte Take-Profits", icon: "🎯" },
          { name: "Auto-Breakeven", desc: "Position abgesichert nach TP1", icon: "🛡️" },
          { name: "Trailing Runner", desc: "15% der Position läuft für Extra-Profit", icon: "🏃" },
          { name: "Risk Shield", desc: "Gefährliche Signale automatisch blockiert", icon: "⚡" },
        ],
      },
      recentSignals: executed.slice(0, 5).map((s: any) => ({
        date: s.created_at,
        action: (s.parsed as any)?.action,
        symbol: (s.parsed as any)?.symbol,
        confidence: (s.parsed as any)?.confidence,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
