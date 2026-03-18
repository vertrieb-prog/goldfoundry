// ═══════════════════════════════════════════════════════════════
// src/lib/points/fast-start.ts — Fast Start Bonus (on PAYMENT only)
// ═══════════════════════════════════════════════════════════════

import { creditFP } from "./forge-points";

const FAST_START_BONUSES = {
    first_sale: { fp: 200, description: "Erster Verkauf Bonus" },
    first_3: { fp: 500, description: "3 Kunden in 7 Tagen" },
    first_5: { fp: 1000, description: "5 Kunden in 14 Tagen" },
    first_10: { fp: 2500, description: "10 Kunden in 30 Tagen" },
    speed_3: { fp: 300, description: "3 Kunden in 3 Tagen" },
    speed_5: { fp: 750, description: "5 Kunden in 5 Tagen" },
};

// ── Check and Credit Fast Start Bonuses ─────────────────────
export async function checkFastStart(sponsorId: string, referralCount: number, daysActive: number) {
    const bonuses: string[] = [];

    if (referralCount >= 1 && daysActive <= 30) {
        await maybeCredit(sponsorId, "first_sale");
        bonuses.push("first_sale");
    }

    if (referralCount >= 3 && daysActive <= 3) {
        await maybeCredit(sponsorId, "speed_3");
        bonuses.push("speed_3");
    }

    if (referralCount >= 3 && daysActive <= 7) {
        await maybeCredit(sponsorId, "first_3");
        bonuses.push("first_3");
    }

    if (referralCount >= 5 && daysActive <= 5) {
        await maybeCredit(sponsorId, "speed_5");
        bonuses.push("speed_5");
    }

    if (referralCount >= 5 && daysActive <= 14) {
        await maybeCredit(sponsorId, "first_5");
        bonuses.push("first_5");
    }

    if (referralCount >= 10 && daysActive <= 30) {
        await maybeCredit(sponsorId, "first_10");
        bonuses.push("first_10");
    }

    return bonuses;
}

async function maybeCredit(userId: string, bonusKey: keyof typeof FAST_START_BONUSES) {
    const bonus = FAST_START_BONUSES[bonusKey];
    // Credit only on payment — this function should only be called after payment confirmation
    await creditFP(userId, bonus.fp, "fast_start", `Fast Start: ${bonus.description}`);
}
