// ═══════════════════════════════════════════════════════════════
// src/lib/points/achievements.ts — 15 Achievement Badges
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { creditFP } from "./forge-points";

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    fpReward: number;
    condition: string;
}

export const ACHIEVEMENTS: Achievement[] = [
    { id: "first_trade", name: "Erster Trade", description: "Deinen ersten Trade platziert", icon: "🎯", fpReward: 50, condition: "trades >= 1" },
    { id: "ten_trades", name: "10 Trades", description: "10 Trades geschlossen", icon: "📊", fpReward: 100, condition: "trades >= 10" },
    { id: "hundred_trades", name: "100 Trades", description: "100 Trades geschlossen", icon: "💯", fpReward: 500, condition: "trades >= 100" },
    { id: "first_profit", name: "Erster Gewinn", description: "Den ersten profitablen Trade gemacht", icon: "💰", fpReward: 50, condition: "first_profit" },
    { id: "streak_7", name: "7-Tage Streak", description: "7 Tage in Folge eingeloggt", icon: "🔥", fpReward: 100, condition: "streak >= 7" },
    { id: "streak_30", name: "30-Tage Streak", description: "30 Tage in Folge eingeloggt", icon: "⚡", fpReward: 500, condition: "streak >= 30" },
    { id: "first_referral", name: "Erster Partner", description: "Den ersten Partner geworben", icon: "🤝", fpReward: 200, condition: "referrals >= 1" },
    { id: "five_referrals", name: "5 Partner", description: "5 Partner geworben", icon: "👥", fpReward: 500, condition: "referrals >= 5" },
    { id: "rank_silber", name: "Silber Rank", description: "Silber-Rang erreicht", icon: "🥈", fpReward: 300, condition: "rank >= silber" },
    { id: "rank_gold", name: "Gold Rank", description: "Gold-Rang erreicht", icon: "🥇", fpReward: 1000, condition: "rank >= gold" },
    { id: "rank_diamond", name: "Diamond Rank", description: "Diamond-Rang erreicht", icon: "💎", fpReward: 3000, condition: "rank >= diamond" },
    { id: "first_payout", name: "Erste Auszahlung", description: "Erste FP-Auszahlung erhalten", icon: "🏦", fpReward: 100, condition: "payouts >= 1" },
    { id: "journal_pro", name: "Journal Pro", description: "50 Journal-Einträge geschrieben", icon: "📝", fpReward: 200, condition: "journal >= 50" },
    { id: "community_star", name: "Community Star", description: "10 Community-Posts mit 5+ Likes", icon: "⭐", fpReward: 300, condition: "popular_posts >= 10" },
    { id: "challenge_winner", name: "Challenge Gewinner", description: "Eine Prop-Firm Challenge bestanden", icon: "🏆", fpReward: 1000, condition: "challenges_won >= 1" },
];

// ── Check and Award Achievements ────────────────────────────
export async function checkAchievements(userId: string, stats: {
    trades?: number;
    firstProfit?: boolean;
    streak?: number;
    referrals?: number;
    rank?: string;
    payouts?: number;
    journalEntries?: number;
    popularPosts?: number;
    challengesWon?: number;
}): Promise<Achievement[]> {
    // Get already earned achievements
    const { data: earned } = await supabaseAdmin
        .from("fp_achievements")
        .select("achievement_id")
        .eq("user_id", userId);

    const earnedIds = new Set((earned || []).map(e => e.achievement_id));
    const newAchievements: Achievement[] = [];

    const rankOrder = ["starter", "bronze", "silber", "gold", "diamond", "crown", "legendary"];
    const userRankIdx = rankOrder.indexOf(stats.rank || "starter");

    for (const achievement of ACHIEVEMENTS) {
        if (earnedIds.has(achievement.id)) continue;

        let qualified = false;
        switch (achievement.id) {
            case "first_trade": qualified = (stats.trades || 0) >= 1; break;
            case "ten_trades": qualified = (stats.trades || 0) >= 10; break;
            case "hundred_trades": qualified = (stats.trades || 0) >= 100; break;
            case "first_profit": qualified = !!stats.firstProfit; break;
            case "streak_7": qualified = (stats.streak || 0) >= 7; break;
            case "streak_30": qualified = (stats.streak || 0) >= 30; break;
            case "first_referral": qualified = (stats.referrals || 0) >= 1; break;
            case "five_referrals": qualified = (stats.referrals || 0) >= 5; break;
            case "rank_silber": qualified = userRankIdx >= 2; break;
            case "rank_gold": qualified = userRankIdx >= 3; break;
            case "rank_diamond": qualified = userRankIdx >= 4; break;
            case "first_payout": qualified = (stats.payouts || 0) >= 1; break;
            case "journal_pro": qualified = (stats.journalEntries || 0) >= 50; break;
            case "community_star": qualified = (stats.popularPosts || 0) >= 10; break;
            case "challenge_winner": qualified = (stats.challengesWon || 0) >= 1; break;
        }

        if (qualified) {
            await supabaseAdmin.from("fp_achievements").insert({
                user_id: userId,
                achievement_id: achievement.id,
                earned_at: new Date().toISOString(),
            });
            await creditFP(userId, achievement.fpReward, "achievement", `Achievement: ${achievement.name}`);
            newAchievements.push(achievement);
        }
    }

    return newAchievements;
}
