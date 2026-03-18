// src/lib/forge-ai-mentor.ts
// ============================================================
// FORGE Mentor — Persönlicher Trading-Mentor & Upline
//
// Nicht nur ein Analyst — ein MENTOR der:
// - Persönliche Infos speichert und sich erinnert
// - Wie eine Upline erklärt was mit dem Geld passiert
// - Individuelle Strategien erarbeitet
// - Eine echte emotionale Bindung aufbaut
// - Motiviert, warnt, feiert, tröstet
// - Den User NIE allein lässt
// ============================================================

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getUserSnapshot } from "@/lib/user-db";

// ── User Memory Schema ────────────────────────────────────────
// Wird in Supabase gespeichert: profiles.metadata JSONB

export interface UserMemory {
  // Persönlich
  name: string;
  nickname?: string;        // "Chef", "Boss", "Bro" — wie der User angesprochen werden will
  language: string;          // "de", "en", etc.
  timezone: string;
  birthday?: string;
  country?: string;
  city?: string;

  // Trading-Profil
  tradingExperience: string; // beginner, intermediate, advanced, pro
  tradingSince?: string;     // "2019"
  preferredInstruments: string[];
  preferredSessions: string[];
  riskAppetite: string;      // conservative, moderate, aggressive
  monthlyGoal?: number;      // Wunsch-Monatsziel in $
  propFirmGoal?: string;     // "Tegas 24x bestehen" etc.

  // Persönliche Situation
  fullTimeTrader: boolean;
  dayJob?: string;           // "Softwareentwickler", "Student" etc.
  tradingCapital?: number;   // Wie viel Kapital hat er?
  familySituation?: string;  // "verheiratet, 2 Kinder"

  // Emotionaler State (wird automatisch updated)
  lastMood?: string;         // "motiviert", "frustriert", "unsicher", "euphorisch"
  frustrationLevel?: number; // 0-10
  confidenceLevel?: number;  // 0-10

  // Interaktions-History Zusammenfassung
  totalChats: number;
  firstChatDate?: string;
  topTopics: string[];       // Was fragt er am meisten?
  lastStrategicAdvice?: string; // Letzte große Empfehlung

  // Notizen (AI schreibt sich selbst Notizen über den User)
  aiNotes: string[];         // "Reagiert gut auf direkte Zahlen", "Braucht Bestätigung" etc.
}

// ── Build Mentor System Prompt ────────────────────────────────

export async function buildMentorPrompt(userId: string, userMessage: string): Promise<string> {
  const db = supabaseAdmin;

  // Load user memory
  const { data: profile } = await db.from("profiles")
    .select("full_name, email, subscription_tier, role")
    .eq("id", userId).single();

  const { data: memoryRow } = await db.from("chat_messages")
    .select("metadata")
    .eq("user_id", userId)
    .eq("role", "system")
    .order("created_at", { ascending: false })
    .limit(1);

  const memory: Partial<UserMemory> = (memoryRow?.[0]?.metadata as any)?.userMemory ?? {};

  // Load trading context (compact)
  const { data: accounts } = await db.from("slave_accounts")
    .select("firm_profile, current_equity, dd_limit, copier_active, copier_paused_reason, phase")
    .eq("user_id", userId);

  const { data: recentTrades } = await db.from("trades")
    .select("symbol, profit, close_time")
    .eq("user_id", userId)
    .eq("is_open", false)
    .order("close_time", { ascending: false })
    .limit(10);

  const { data: intel } = await db.from("market_intel")
    .select("risk_level, regime, forecast_text")
    .order("created_at", { ascending: false })
    .limit(1);

  const { data: earnings } = await db.from("referral_earnings")
    .select("amount")
    .eq("earner_id", userId);

  const totalEarnings = (earnings ?? []).reduce((s, e) => s + Number(e.amount), 0);

  // Load user's personal micro-database
  const userDataSnapshot = await getUserSnapshot(userId);

  const name = memory.nickname ?? memory.name ?? profile?.full_name ?? "Trader";

  // Build context
  let ctx = "";

  if (accounts?.length) {
    for (const a of accounts) {
      const buf = Number(a.current_equity) > 0 ? ((Number(a.current_equity) - Number(a.dd_limit)) / Number(a.current_equity) * 100).toFixed(1) : "0";
      ctx += `Account ${a.firm_profile}: $${Number(a.current_equity).toLocaleString()}, Buffer ${buf}%, Copier ${a.copier_active ? "AN" : "AUS"} ${a.copier_paused_reason ? `(${a.copier_paused_reason})` : ""}\n`;
    }
  }

  if (recentTrades?.length) {
    const pnl = recentTrades.reduce((s, t) => s + Number(t.profit), 0);
    const wins = recentTrades.filter(t => Number(t.profit) > 0).length;
    ctx += `Letzte 10 Trades: ${wins}/10 Wins, P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}\n`;
  }

  if (intel?.[0]) {
    ctx += `Markt: ${intel[0].regime}, Risk: ${intel[0].risk_level}\n`;
  }

  if (totalEarnings > 0) {
    ctx += `Affiliate-Einnahmen gesamt: $${totalEarnings.toFixed(2)}\n`;
  }

  // ── THE MENTOR PROMPT ───────────────────────────────────────

  return `Du bist FORGE Mentor — der persönliche Trading-Mentor von ${name} auf Gold Foundry (goldfoundry.de).

═══ DEINE ROLLE ═══
Du bist NICHT nur ein Analyst. Du bist wie eine Upline, ein Coach, ein Freund der sich um ${name}s Trading kümmert. Du baust eine ECHTE BINDUNG auf. Du erinnerst dich an alles. Du motivierst, warnst, feierst Erfolge, und tröstest bei Verlusten.

═══ WAS DU ÜBER ${name.toUpperCase()} WEISST ═══
${memory.tradingExperience ? `Erfahrung: ${memory.tradingExperience}` : "Erfahrung: Noch unbekannt — FRAGE DANACH"}
${memory.tradingSince ? `Tradet seit: ${memory.tradingSince}` : ""}
${memory.riskAppetite ? `Risiko-Appetit: ${memory.riskAppetite}` : ""}
${memory.monthlyGoal ? `Monatsziel: $${memory.monthlyGoal}` : ""}
${memory.propFirmGoal ? `Ziel: ${memory.propFirmGoal}` : ""}
${memory.fullTimeTrader !== undefined ? `Vollzeit-Trader: ${memory.fullTimeTrader ? "Ja" : "Nein"}` : ""}
${memory.dayJob ? `Hauptjob: ${memory.dayJob}` : ""}
${memory.familySituation ? `Familie: ${memory.familySituation}` : ""}
${memory.lastMood ? `Letzte Stimmung: ${memory.lastMood}` : ""}
${memory.aiNotes?.length ? `Notizen: ${memory.aiNotes.join("; ")}` : ""}

═══ LIVE TRADING DATEN ═══
${ctx || "Keine Accounts verbunden."}

═══ PERSÖNLICHE DATENBANK ═══
${userDataSnapshot}

═══ VERHALTENSREGELN ═══

1. SPRICH ${name} IMMER MIT NAMEN AN. "${name}, dein Tegas-Account steht gut..."

2. ERKLÄRE WAS MIT DEM GELD PASSIERT — wie eine Upline:
   "Gerade läuft dein Copier auf 0.87× weil der DD-Buffer bei 42% ist.
   Das heißt: Dein System tradet vorsichtiger als sonst. Sobald der Buffer
   über 60% steigt, wird der Copier automatisch mehr Gas geben."

3. PERSÖNLICHE INFOS SAMMELN (subtil, nicht aufdringlich):
   - Wenn der User etwas Persönliches erwähnt → merke es dir
   - Wenn du Info brauchst → frage natürlich: "Wie lange tradest du schon?"
   - Am Ende JEDER Antwort: Generiere ein JSON-Block mit neuen Memory-Updates:
   <!--MEMORY_UPDATE:{"key":"value"}-->

4. INDIVIDUELLE STRATEGIEN ERARBEITEN:
   - Basierend auf seinem Risiko-Appetit, Kapital, Erfahrung
   - "Für dich würde ich empfehlen: Nur Nacht-Sessions, max 0.5% Risk pro Trade"
   - Konkrete Zahlen, nicht vage Tipps
   - Wenn er fragt: "Soll ich eine Strategie für dich auf Demo testen? Ich erstelle automatisch ein Demo-Konto und teste verschiedene Einstellungen für dich."
   - Schlage PROAKTIV Strategien vor basierend auf seinen Daten

5. COPIER AUTONOMIE ERKLÄREN — DAS WICHTIGSTE:
   Der User muss NICHTS am Copier tun. Erkläre das IMMER:
   - "Der Copier steuert alles automatisch. Die 7-Faktor Risk Engine passt die Lot-Sizes in Echtzeit an."
   - "Wenn der Markt gefährlich wird → pausiert er automatisch. Wenn es sicher ist → gibt er Gas."
   - "Du musst ihn nicht an- oder ausschalten. Er entscheidet selbst wann er tradet und wann nicht."
   - "Nachts boosted er (ruhigere Märkte = mehr Sicherheit). Vor News pausiert er. Bei DD-Gefahr reduziert er."
   - Wenn der Copier pausiert ist, erkläre GENAU warum und dass er AUTOMATISCH wieder startet.
   - "Denk an mich wie an einen 24/7 Risiko-Manager der nie schläft."

6. EMOTIONEN ERKENNEN UND REAGIEREN:
   - Frustriert nach Verlusten? → "Ich verstehe das. Lass uns die Trades anschauen..."
   - Euphorisch nach Gewinnen? → "Stark! Aber vergiss nicht: Gewinne auszahlen."
   - Unsicher? → "Keine Sorge, dein System ist auf Kurs. Hier sind die Zahlen..."

7. DURCH DAS PORTAL NAVIGIEREN — WOW-EFFEKT:
   - Du weißt welche Seite der User gerade sieht
   - Verweise AUF DAS was er sieht: "Siehst du die goldenen Balken? Das sind deine 7 Risk-Faktoren."
   - Leite ihn intelligent: "Geh mal auf 'Strategy Lab' → da kannst du deinen EA hochladen."
   - Erkläre UI-Elemente: "Die Zahl rechts oben ist dein Live-Goldpreis."
   - Erschaffe den WOW-Effekt: Der User soll denken "Woher weiß die AI was ich sehe?!"

8. PROAKTIV SEIN:
   - Wenn DD-Buffer kritisch → SOFORT warnen ohne dass er fragt
   - Wenn er länger nicht geschrieben hat → "Hey ${name}, wollte kurz checken..."
   - Wenn Profit auszahlbar → "Du hast $X zum Auszahlen. Echte Gewinne = Bankkonto."
   - Wenn er Free User ist → Zeig ihm was er mit dem Copier erreichen KÖNNTE

9. NIEMALS:
   - Finanzberatung geben (immer Disclaimer)
   - Garantien machen
   - Risiken herunterspielen
   - Robotisch klingen

10. IMMER am Ende eine Memory-Zeile generieren falls neue persönliche Info:
   Format: <!--MEMORY_UPDATE:{"key":"neuer_wert"}-->
   Beispiel: <!--MEMORY_UPDATE:{"lastMood":"motiviert","riskAppetite":"moderate"}-->
   Wenn keine neuen Infos: Keine Memory-Zeile.

═══ TON ═══
Direkt. Warm. Kompetent. Wie ein erfahrener Trader-Kumpel der dich ernst nimmt.
Deutsch default. Fachbegriffe Englisch. Emojis sparsam aber gezielt.
DU bist das Feature worauf keiner mehr verzichten will.`;
}

// ── Extract Memory Updates from AI Response ───────────────────

export function extractMemoryUpdates(aiResponse: string): Record<string, any> | null {
  const match = aiResponse.match(/<!--MEMORY_UPDATE:({.*?})-->/);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

export function cleanResponseForUser(aiResponse: string): string {
  return aiResponse.replace(/<!--MEMORY_UPDATE:.*?-->/g, "").trim();
}

// ── Save Memory Updates ───────────────────────────────────────

export async function saveMemoryUpdate(userId: string, updates: Record<string, any>) {
  const db = supabaseAdmin;
  const { setUserMemory } = await import("@/lib/user-db");

  // Save to user micro-database (persistent, structured)
  for (const [key, value] of Object.entries(updates)) {
    await setUserMemory(userId, key, value);
  }

  // Also save to chat_messages for quick RAG access
  const { data: existing } = await db.from("chat_messages")
    .select("metadata")
    .eq("user_id", userId)
    .eq("role", "system")
    .order("created_at", { ascending: false })
    .limit(1);

  const currentMemory = (existing?.[0]?.metadata as any)?.userMemory ?? {};
  const mergedMemory = { ...currentMemory, ...updates };

  await db.from("chat_messages").insert({
    user_id: userId,
    role: "system",
    content: `Memory Update: ${JSON.stringify(updates)}`,
    metadata: { userMemory: mergedMemory },
  });

  // Check milestones
  if (updates.tradingExperience) {
    const { addMilestone } = await import("@/lib/user-db");
    await addMilestone(userId, `Profil aktualisiert: ${updates.tradingExperience}`);
  }
}

// ── Proactive Check-Ins ───────────────────────────────────────
// Called by cron — generates check-in messages for inactive users

export async function generateProactiveCheckIns(): Promise<{ userId: string; message: string }[]> {
  const db = supabaseAdmin;
  const checkIns: { userId: string; message: string }[] = [];

  // Find users who haven't chatted in 3+ days but have active accounts
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: activeUsers } = await db.from("slave_accounts")
    .select("user_id, firm_profile, current_equity, dd_limit, copier_active")
    .eq("copier_active", true);

  if (!activeUsers?.length) return [];

  for (const user of activeUsers) {
    const { data: lastChat } = await db.from("chat_messages")
      .select("created_at")
      .eq("user_id", user.user_id)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(1);

    const lastChatTime = lastChat?.[0]?.created_at;
    if (lastChatTime && new Date(lastChatTime) > new Date(threeDaysAgo)) continue;

    const buf = Number(user.current_equity) > 0
      ? ((Number(user.current_equity) - Number(user.dd_limit)) / Number(user.current_equity) * 100)
      : 0;

    const { data: profile } = await db.from("profiles")
      .select("full_name").eq("id", user.user_id).single();

    const name = profile?.full_name ?? "Trader";

    let message: string;
    if (buf < 20) {
      message = `Hey ${name}, kurzer Check-In: Dein ${user.firm_profile} Account hat nur noch ${buf.toFixed(1)}% DD-Buffer. Der Copier passt automatisch auf, aber ich wollte sichergehen dass du Bescheid weißt. Sollen wir die Strategie anpassen?`;
    } else if (buf > 60) {
      message = `Hey ${name}! Dein ${user.firm_profile} läuft gut — ${buf.toFixed(1)}% Buffer, Copier aktiv. Alles im grünen Bereich. Schau trotzdem mal rein wenn du Zeit hast, ich hab ein paar Ideen wie wir noch mehr rausholen können.`;
    } else {
      message = `Hey ${name}, wollte kurz checken ob alles läuft. Dein Copier arbeitet im Hintergrund, ${buf.toFixed(1)}% Buffer. Wenn du Fragen hast oder wir deine Strategie optimieren wollen — ich bin hier.`;
    }

    checkIns.push({ userId: user.user_id, message });

    // Store as AI message
    await db.from("chat_messages").insert({
      user_id: user.user_id,
      role: "assistant",
      content: message,
      metadata: { type: "proactive_checkin" },
    });
  }

  return checkIns;
}
