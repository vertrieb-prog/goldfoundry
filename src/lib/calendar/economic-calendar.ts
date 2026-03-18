// ═══════════════════════════════════════════════════════════════
// src/lib/calendar/economic-calendar.ts — Economic Calendar
// ═══════════════════════════════════════════════════════════════

export interface EconomicEvent {
    time: string;
    currency: string;
    impact: "low" | "medium" | "high";
    event: string;
    forecast: string | null;
    previous: string | null;
    actual: string | null;
}

// ── High Impact Events that block trading ───────────────────
const HIGH_IMPACT_EVENTS = [
    "Non-Farm Payroll", "NFP", "FOMC", "Interest Rate Decision",
    "CPI", "Consumer Price Index", "GDP", "ECB Press Conference",
    "BOE Rate Decision", "BOJ Rate Decision", "RBA Rate Decision",
    "Unemployment Rate", "Retail Sales", "PMI",
];

// ── Get Today's Events ──────────────────────────────────────
export async function getTodayEvents(): Promise<EconomicEvent[]> {
    try {
        // Use free forex factory API or investing.com scraper
        const today = new Date().toISOString().split("T")[0];
        const resp = await fetch(`https://nfs.faireconomy.media/ff_calendar_thisweek.json`, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; GoldFoundry/1.0)" },
        });
        if (!resp.ok) return [];

        const events = await resp.json();
        return (events || [])
            .filter((e: any) => e.date?.startsWith(today))
            .map((e: any) => ({
                time: e.date || "",
                currency: e.country || "",
                impact: e.impact === "High" ? "high" : e.impact === "Medium" ? "medium" : "low",
                event: e.title || "",
                forecast: e.forecast || null,
                previous: e.previous || null,
                actual: e.actual || null,
            }));
    } catch {
        return [];
    }
}

// ── Should Block Trading ────────────────────────────────────
export function shouldBlockTrading(events: EconomicEvent[], symbol: string): {
    block: boolean;
    reason: string;
    blockUntil: string | null;
    events: EconomicEvent[];
} {
    const now = new Date();
    const blockWindow = 15; // minutes before and after

    const currencyMap: Record<string, string[]> = {
        USD: ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "USDCAD", "AUDUSD", "NZDUSD", "US500", "US30", "NAS100", "BTCUSD"],
        EUR: ["EURUSD", "EURGBP", "EURJPY", "DE40", "EU50", "FR40"],
        GBP: ["GBPUSD", "EURGBP", "GBPJPY", "UK100"],
        JPY: ["USDJPY", "EURJPY", "GBPJPY", "JP225"],
        AUD: ["AUDUSD", "AU200"],
        CAD: ["USDCAD"],
        CHF: ["USDCHF"],
    };

    const relevantEvents = events.filter(e => {
        if (e.impact !== "high") return false;
        if (!HIGH_IMPACT_EVENTS.some(h => e.event.includes(h))) return false;

        // Check if event currency affects our symbol
        const affectedSymbols = currencyMap[e.currency] || [];
        if (!affectedSymbols.includes(symbol) && !affectedSymbols.some(s => symbol.includes(s))) return false;

        // Check time window
        const eventTime = new Date(e.time);
        const diffMinutes = (eventTime.getTime() - now.getTime()) / 60000;
        return diffMinutes > -blockWindow && diffMinutes < blockWindow;
    });

    if (relevantEvents.length > 0) {
        const latestEvent = relevantEvents[relevantEvents.length - 1];
        const blockUntil = new Date(new Date(latestEvent.time).getTime() + blockWindow * 60000);
        return {
            block: true,
            reason: `High Impact: ${relevantEvents.map(e => e.event).join(", ")}`,
            blockUntil: blockUntil.toISOString(),
            events: relevantEvents,
        };
    }

    return { block: false, reason: "", blockUntil: null, events: [] };
}

// ── Get Upcoming High Impact Events ─────────────────────────
export async function getUpcomingHighImpact(hours: number = 24): Promise<EconomicEvent[]> {
    const events = await getTodayEvents();
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 3600000);

    return events.filter(e => {
        if (e.impact !== "high") return false;
        const eventTime = new Date(e.time);
        return eventTime >= now && eventTime <= cutoff;
    });
}
