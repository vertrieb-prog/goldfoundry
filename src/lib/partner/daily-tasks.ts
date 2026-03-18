// ═══════════════════════════════════════════════════════════════
// src/lib/partner/daily-tasks.ts — Daily Tasks + Streak System
// 5 Tasks/Tag, Streak 14d=200FP, 30d=500FP
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { creditFP } from "@/lib/points/forge-points";

const DAILY_TASK_TEMPLATES = [
    { id: "share_result", label: "Teile ein Ergebnis auf Social Media", fp: 10 },
    { id: "invite_contact", label: "Lade 1 Kontakt ein", fp: 15 },
    { id: "check_dashboard", label: "Prüfe dein Dashboard", fp: 5 },
    { id: "help_partner", label: "Hilf einem Partner im Team", fp: 20 },
    { id: "create_content", label: "Erstelle einen Social Media Post", fp: 15 },
    { id: "study_material", label: "Studiere ein Trainings-Video", fp: 10 },
    { id: "update_landing", label: "Optimiere deine Landing Page", fp: 10 },
    { id: "send_followup", label: "Sende ein Follow-Up an einen Lead", fp: 15 },
    { id: "engage_community", label: "Beteilige dich in der Community", fp: 10 },
    { id: "review_stats", label: "Analysiere deine Wochenstatistik", fp: 10 },
];

// ── Get Today's Tasks ───────────────────────────────────────
export async function getDailyTasks(userId: string): Promise<{
    tasks: Array<{ id: string; label: string; fp: number; completed: boolean }>;
    streak: number;
    date: string;
}> {
    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabaseAdmin
        .from("daily_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

    if (existing) {
        return {
            tasks: existing.tasks || [],
            streak: existing.streak || 0,
            date: today,
        };
    }

    // Generate 5 random tasks for today
    const shuffled = [...DAILY_TASK_TEMPLATES].sort(() => Math.random() - 0.5);
    const todayTasks = shuffled.slice(0, 5).map(t => ({ ...t, completed: false }));

    // Get streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const { data: yesterdayData } = await supabaseAdmin
        .from("daily_tasks")
        .select("streak, completed")
        .eq("user_id", userId)
        .eq("date", yesterday)
        .single();

    const streak = (yesterdayData?.completed >= 3) ? (yesterdayData?.streak || 0) + 1 : 0;

    await supabaseAdmin.from("daily_tasks").insert({
        user_id: userId,
        date: today,
        tasks: todayTasks,
        completed: 0,
        total: 5,
        streak,
    });

    return { tasks: todayTasks, streak, date: today };
}

// ── Complete Task ───────────────────────────────────────────
export async function completeTask(userId: string, taskId: string): Promise<{ success: boolean; fpEarned: number; streakBonus: number }> {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabaseAdmin
        .from("daily_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

    if (!data) return { success: false, fpEarned: 0, streakBonus: 0 };

    const tasks = data.tasks as any[];
    const task = tasks.find((t: any) => t.id === taskId);
    if (!task || task.completed) return { success: false, fpEarned: 0, streakBonus: 0 };

    task.completed = true;
    const completedCount = tasks.filter((t: any) => t.completed).length;

    await supabaseAdmin.from("daily_tasks").update({
        tasks,
        completed: completedCount,
    }).eq("user_id", userId).eq("date", today);

    // Credit FP
    await creditFP(userId, task.fp, "daily_task", `Daily Task: ${task.label}`);

    // Check streak bonuses
    let streakBonus = 0;
    const streak = data.streak || 0;
    if (streak === 14 && completedCount === 5) {
        streakBonus = 200;
        await creditFP(userId, 200, "streak_bonus", "14-Tage Streak Bonus!");
    } else if (streak === 30 && completedCount === 5) {
        streakBonus = 500;
        await creditFP(userId, 500, "streak_bonus", "30-Tage Streak Bonus!");
    }

    return { success: true, fpEarned: task.fp, streakBonus };
}
