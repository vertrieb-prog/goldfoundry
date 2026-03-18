// ═══════════════════════════════════════════════════════════════
// src/lib/multi-account/aggregator.ts — Multi-Account Aggregator
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

export interface AccountSummary {
    id: string;
    name: string;
    broker: string;
    balance: number;
    equity: number;
    profit: number;
    drawdown: number;
    openTrades: number;
    status: "active" | "paused" | "error";
}

export interface AggregatedStats {
    totalBalance: number;
    totalEquity: number;
    totalProfit: number;
    maxDrawdown: number;
    avgDrawdown: number;
    totalOpenTrades: number;
    accountCount: number;
    accounts: AccountSummary[];
    alerts: CriticalAlert[];
}

export interface CriticalAlert {
    accountId: string;
    accountName: string;
    type: "dd_warning" | "dd_critical" | "connection_lost" | "margin_call" | "daily_loss";
    message: string;
    severity: "warning" | "critical";
    timestamp: string;
}

// ── Get All Accounts ────────────────────────────────────────
export async function getAllAccounts(userId: string): Promise<AccountSummary[]> {
    const { data } = await supabaseAdmin
        .from("trading_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    return (data || []).map((a: any) => ({
        id: a.id,
        name: a.name || `Account ${a.id.slice(0, 6)}`,
        broker: a.broker || "Unknown",
        balance: a.balance || 0,
        equity: a.equity || 0,
        profit: a.profit || 0,
        drawdown: a.drawdown || 0,
        openTrades: a.open_trades || 0,
        status: a.status || "active",
    }));
}

// ── Get Aggregated Stats ────────────────────────────────────
export async function getAggregatedStats(userId: string): Promise<AggregatedStats> {
    const accounts = await getAllAccounts(userId);
    const alerts = getCriticalAlerts(accounts);

    const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0);
    const totalEquity = accounts.reduce((a, acc) => a + acc.equity, 0);
    const totalProfit = accounts.reduce((a, acc) => a + acc.profit, 0);
    const drawdowns = accounts.map(a => a.drawdown);
    const maxDrawdown = drawdowns.length > 0 ? Math.max(...drawdowns) : 0;
    const avgDrawdown = drawdowns.length > 0 ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length : 0;
    const totalOpenTrades = accounts.reduce((a, acc) => a + acc.openTrades, 0);

    return {
        totalBalance,
        totalEquity,
        totalProfit,
        maxDrawdown,
        avgDrawdown: Math.round(avgDrawdown * 100) / 100,
        totalOpenTrades,
        accountCount: accounts.length,
        accounts,
        alerts,
    };
}

// ── Get Critical Alerts ─────────────────────────────────────
export function getCriticalAlerts(accounts: AccountSummary[]): CriticalAlert[] {
    const alerts: CriticalAlert[] = [];

    for (const acc of accounts) {
        // DD Warning (>5%)
        if (acc.drawdown >= 5 && acc.drawdown < 8) {
            alerts.push({
                accountId: acc.id,
                accountName: acc.name,
                type: "dd_warning",
                message: `Drawdown bei ${acc.drawdown.toFixed(1)}% — Vorsicht!`,
                severity: "warning",
                timestamp: new Date().toISOString(),
            });
        }

        // DD Critical (>8%)
        if (acc.drawdown >= 8) {
            alerts.push({
                accountId: acc.id,
                accountName: acc.name,
                type: "dd_critical",
                message: `⚠️ KRITISCH: Drawdown bei ${acc.drawdown.toFixed(1)}%! Sofort handeln!`,
                severity: "critical",
                timestamp: new Date().toISOString(),
            });
        }

        // Connection lost
        if (acc.status === "error") {
            alerts.push({
                accountId: acc.id,
                accountName: acc.name,
                type: "connection_lost",
                message: "Verbindung zum Account verloren. Bitte prüfen.",
                severity: "critical",
                timestamp: new Date().toISOString(),
            });
        }

        // Margin call warning (equity < 50% of balance)
        if (acc.equity < acc.balance * 0.5 && acc.equity > 0) {
            alerts.push({
                accountId: acc.id,
                accountName: acc.name,
                type: "margin_call",
                message: "Margin Call droht! Equity unter 50% der Balance.",
                severity: "critical",
                timestamp: new Date().toISOString(),
            });
        }
    }

    return alerts.sort((a, b) => (a.severity === "critical" ? -1 : 1));
}
