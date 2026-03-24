export const dynamic = "force-dynamic";
// ═══════════════════════════════════════════════════════════════
// Admin: Smart Trade Management Performance
// Berechnet Mehrwert durch 4-Split TPs, Auto-Breakeven, Trailing
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createSupabaseAdmin();

    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Get all executed signals with their parsed data
    const { data: executedSignals } = await db
      .from("telegram_signals")
      .select("*")
      .eq("status", "executed")
      .order("created_at", { ascending: false })
      .limit(200);

    // Get copier log for actual execution results
    const { data: copierLog } = await db
      .from("copier_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    // Get all trades
    const { data: trades } = await db
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    // Calculate Smart Order advantage
    let smartOrderProfit = 0;
    let simpleOrderProfit = 0;
    let breakevenSaves = 0;
    let trailingSaves = 0;
    let splitTpExtra = 0;
    let totalExecutedTrades = 0;

    // Analyze executed signals
    for (const signal of (executedSignals || [])) {
      const parsed = signal.parsed as any;
      if (!parsed || !parsed.symbol) continue;

      const entry = parsed.entryPrice || 0;
      const sl = parsed.stopLoss || 0;
      const tps = parsed.takeProfits || [];

      if (!entry || !sl || tps.length === 0) continue;

      totalExecutedTrades++;
      const slDistance = Math.abs(entry - sl);
      const tp1Distance = tps[0] ? Math.abs(tps[0] - entry) : slDistance;
      const tp2Distance = tps[1] ? Math.abs(tps[1] - entry) : tp1Distance * 1.5;
      const tp3Distance = tps[2] ? Math.abs(tps[2] - entry) : tp1Distance * 2;

      // Simulate: Simple order (100% at TP1)
      // vs Smart order (40% TP1, 25% TP2, 20% TP3, 15% runner)
      const pipValue = parsed.symbol === "XAUUSD" ? 1 : 10;
      const lots = 0.05; // average

      // Simple: all at TP1
      const simpleProfit = tp1Distance * pipValue * lots;

      // Smart: 4-split
      const tp1Profit = tp1Distance * pipValue * (lots * 0.4);
      const tp2Profit = tp2Distance * pipValue * (lots * 0.25);
      const tp3Profit = tp3Distance * pipValue * (lots * 0.2);
      // Runner: assume captures 2x TP1 distance on average (trailing stop)
      const runnerProfit = (tp1Distance * 2) * pipValue * (lots * 0.15);

      const smartProfit = tp1Profit + tp2Profit + tp3Profit + runnerProfit;

      simpleOrderProfit += simpleProfit;
      smartOrderProfit += smartProfit;

      // Breakeven saves: estimate 30% of trades would hit SL after TP1
      // With auto-breakeven, those become 0 loss instead of full SL loss
      const slLoss = slDistance * pipValue * lots;
      breakevenSaves += slLoss * 0.3; // 30% of trades saved by breakeven

      // Trailing: estimate extra 10% capture on runner trades
      trailingSaves += runnerProfit * 0.1;

      // Split TP extra: difference between smart and simple
      splitTpExtra += Math.max(0, smartProfit - simpleProfit);
    }

    // Also analyze copier log for real execution data
    const copiedTrades = (copierLog || []).filter((l: any) => l.action === "COPIED");
    const skippedTrades = (copierLog || []).filter((l: any) => l.action === "SKIPPED");
    const totalRealTrades = (trades || []).length;
    const profitTrades = (trades || []).filter((t: any) => (t.profit || t.pnl_result || 0) > 0);
    const lossTrades = (trades || []).filter((t: any) => (t.profit || t.pnl_result || 0) < 0);
    const totalProfit = (trades || []).reduce((s: number, t: any) => s + (t.profit || t.pnl_result || 0), 0);

    const smartAdvantage = smartOrderProfit - simpleOrderProfit;

    return NextResponse.json({
      smartOrders: {
        totalAnalyzed: totalExecutedTrades,
        smartProfit: Math.round(smartOrderProfit * 100) / 100,
        simpleProfit: Math.round(simpleOrderProfit * 100) / 100,
        advantage: Math.round(smartAdvantage * 100) / 100,
        advantagePercent: simpleOrderProfit > 0
          ? Math.round((smartAdvantage / simpleOrderProfit) * 100)
          : 0,
      },
      features: {
        splitTpExtra: Math.round(splitTpExtra * 100) / 100,
        breakevenSaves: Math.round(breakevenSaves * 100) / 100,
        trailingSaves: Math.round(trailingSaves * 100) / 100,
        totalFeatureValue: Math.round((splitTpExtra + breakevenSaves + trailingSaves) * 100) / 100,
      },
      realPerformance: {
        totalTrades: totalRealTrades,
        profitTrades: profitTrades.length,
        lossTrades: lossTrades.length,
        winRate: totalRealTrades > 0 ? Math.round((profitTrades.length / totalRealTrades) * 100) : 0,
        totalProfit: Math.round(totalProfit * 100) / 100,
        copiedTrades: copiedTrades.length,
        skippedTrades: skippedTrades.length,
      },
      description: {
        splitTp: "4-Split TPs verteilen das Risiko und maximieren Gewinne bei starken Moves",
        breakeven: "Auto-Breakeven sichert Positionen ab sobald TP1 erreicht ist",
        trailing: "Trailing Runner lässt den letzten 15% laufen für Extra-Profit",
        riskShield: "Risk Shield blockiert gefährliche Signale (kein SL, hoher Spread, News)",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
