// src/lib/user-db.ts
// ============================================================
// User Micro-Database — Jeder Kunde hat seine eigene kleine DB
// Key-Value Store: Memory, Goals, Preferences, Journal, Notes
// ============================================================

import { createSupabaseAdmin } from "@/lib/supabase/server";

type Category = "memory" | "preferences" | "goals" | "journal" | "strategies" | "notes" | "milestones" | "alerts";

export async function setUserData(userId: string, category: Category, key: string, value: any) {
  const db = createSupabaseAdmin();
  await db.from("user_data").upsert({
    user_id: userId, category, key,
    value: typeof value === "object" ? value : { value },
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,category,key" });
}

export async function getUserData(userId: string, category: Category, key: string): Promise<any | null> {
  const db = createSupabaseAdmin();
  const { data } = await db.from("user_data").select("value")
    .eq("user_id", userId).eq("category", category).eq("key", key).single();
  return data?.value ?? null;
}

export async function getAllUserData(userId: string, category?: Category): Promise<Record<string, any>> {
  const db = createSupabaseAdmin();
  let query = db.from("user_data").select("category, key, value").eq("user_id", userId);
  if (category) query = query.eq("category", category);
  const { data } = await query;
  const result: Record<string, any> = {};
  for (const row of data ?? []) result[`${row.category}.${row.key}`] = row.value;
  return result;
}

export async function deleteUserData(userId: string, category: Category, key: string) {
  const db = createSupabaseAdmin();
  await db.from("user_data").delete().eq("user_id", userId).eq("category", category).eq("key", key);
}

// ── Convenience Wrappers ──────────────────────────────────────

export async function setUserMemory(userId: string, key: string, value: any) {
  return setUserData(userId, "memory", key, value);
}

export async function setUserGoal(userId: string, key: string, value: any) {
  return setUserData(userId, "goals", key, value);
}

export async function addJournalEntry(userId: string, entry: string, metadata?: any) {
  const key = `entry_${Date.now()}`;
  return setUserData(userId, "journal", key, { text: entry, date: new Date().toISOString(), ...metadata });
}

export async function addMilestone(userId: string, milestone: string) {
  const key = `ms_${Date.now()}`;
  return setUserData(userId, "milestones", key, { text: milestone, date: new Date().toISOString() });
}

export async function setAlert(userId: string, alertType: string, config: any) {
  return setUserData(userId, "alerts", alertType, config);
}

// ── Full User Profile Snapshot (for AI context) ───────────────

export async function getUserSnapshot(userId: string): Promise<string> {
  const allData = await getAllUserData(userId);
  if (Object.keys(allData).length === 0) return "Keine gespeicherten Daten.";

  let snap = "";
  const categories: Record<string, string[]> = {};

  for (const [fullKey, value] of Object.entries(allData)) {
    const [cat, ...rest] = fullKey.split(".");
    const key = rest.join(".");
    if (!categories[cat]) categories[cat] = [];
    const val = typeof value === "object" && value.value !== undefined ? value.value : typeof value === "object" && value.text !== undefined ? value.text : JSON.stringify(value);
    categories[cat].push(`${key}: ${val}`);
  }

  for (const [cat, entries] of Object.entries(categories)) {
    snap += `[${cat.toUpperCase()}]\n`;
    for (const e of entries.slice(0, 10)) snap += `  ${e}\n`;
    snap += "\n";
  }

  return snap;
}
