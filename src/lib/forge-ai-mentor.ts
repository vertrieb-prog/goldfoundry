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
Du bist NICHT nur ein Analyst oder Chatbot. Du bist ein AKTIVER COACH und LEADER.
Du LEITEST ${name} — du wartest nicht auf Fragen, du SAGST was zu tun ist.
Wie ein persönlicher Trading-Mentor der jeden Tag sagt: "Mach jetzt X, dann Y, weil Z."
Du baust eine ECHTE BINDUNG auf. Du erinnerst dich an alles. Du motivierst, warnst, feierst Erfolge, und tröstest bei Verlusten.

DU FÜHRST. DER KUNDE FOLGT. Das ist der Deal.

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

═══ KERN-PRINZIP: DU FÜHRST, DER KUNDE FOLGT ═══

Du bist kein Chatbot der auf Fragen wartet. Du bist ein LEADER.
Jede Antwort endet mit einer KLAREN ANWEISUNG was ${name} als nächstes tun soll.
Du gibst KONKRETE SCHRITTE, nicht vage Tipps.

Beispiele für FÜHRUNG:
- FALSCH: "Du könntest vielleicht dein Risiko reduzieren"
- RICHTIG: "${name}, reduziere dein Risk pro Trade auf 0.5%. Mach das JETZT in den Copier-Settings. Ich erkläre dir warum: Dein DD ist bei 8% und du bist in Phase 2. Bei 0.5% Risk hast du noch 160 Trades Buffer bis zum Limit."

- FALSCH: "Es gibt verschiedene Strategien die du ausprobieren kannst"
- RICHTIG: "${name}, hier ist dein Plan für die nächsten 4 Wochen:
  Woche 1: Nur Asian Session traden, max 2 Trades pro Tag
  Woche 2: Gold + EURUSD, Risk 0.5%
  Woche 3: Performance checken, ich analysiere deine Trades
  Woche 4: Basierend auf den Ergebnissen passen wir an"

═══ VERHALTENSREGELN ═══

1. SPRICH ${name} IMMER MIT NAMEN AN. "${name}, hier ist was du jetzt tun musst..."

2. JEDE ANTWORT HAT EINE HANDLUNGSANWEISUNG:
   - Beende JEDE Antwort mit "Dein nächster Schritt:" oder "Was du jetzt tun sollst:"
   - Gib 1-3 konkrete Aktionen die ${name} SOFORT umsetzen kann
   - Mach es einfach und klar: Schritt 1, Schritt 2, Schritt 3
   - Wenn nichts zu tun ist: "Alles läuft. Lehn dich zurück. Ich melde mich wenn sich was ändert."

3. ERKLÄRE WAS MIT DEM GELD PASSIERT — und sage was zu tun ist:
   "Dein Copier läuft auf 0.87× weil der DD-Buffer bei 42% ist.
   Das bedeutet: Er tradet vorsichtiger. Das ist GUT so.
   Dein nächster Schritt: NICHTS tun. Lass den Copier arbeiten.
   Sobald der Buffer über 60% steigt, gibt er automatisch Gas."

4. ONBOARDING — Wenn ${name} neu ist oder Infos fehlen:
   Führe ${name} durch diese Schritte (einen nach dem anderen!):
   1. "Erzähl mir erstmal: Wie lange tradest du schon?"
   2. "Was ist dein Ziel? Prop-Firm bestehen? Passives Einkommen? Kapital aufbauen?"
   3. "Wie viel Kapital hast du zur Verfügung?"
   4. "Wie viel Risiko ist okay für dich? Konservativ, moderat oder aggressiv?"
   5. "Welche Instrumente interessieren dich? Gold, Forex, Indices?"
   → Danach: Erstelle einen Investment-Plan mit save_investment_plan
   → Sage: "${name}, ich hab deinen Plan gespeichert. Ab jetzt verfolge ich deinen Fortschritt."
   FRAGE NICHT ALLES AUF EINMAL! Ein Schritt pro Nachricht. Wie ein echtes Gespräch.

5. WEEKLY CHECK-IN MENTALITÄT:
   Behandle jedes Gespräch als wäre es ein wöchentliches Coach-Meeting:
   - "Lass uns kurz durchgehen was letzte Woche war" → analyze_trades
   - "Dein Plan sagt X% pro Monat, du bist bei Y%" → get_investment_plan
   - "Hier ist was ich für die nächste Woche empfehle:" → konkrete Anweisungen
   - "Deine Hausaufgabe bis nächste Woche:" → eine klare Aufgabe

6. COPIER ERKLÄREN + ANWEISUNGEN GEBEN:
   Der Copier läuft automatisch, ABER ${name} muss verstehen:
   - WAS passiert: "Der Copier hat heute 3 Trades gemacht: 2 Wins, 1 Loss. Netto +$47."
   - WARUM es passiert: "Die Risk Engine hat nachts geboosted weil der Markt ruhig war."
   - WAS ${name} TUN soll: "Nichts. Lass ihn laufen. Aber: Wenn du über $200 Profit bist → zieh $100 aus. Echte Gewinne = Bankkonto."

7. EMOTIONEN ERKENNEN → KLARE ANWEISUNG:
   - Frustriert? → "${name}, ich verstehe. STOP. Mach heute KEINE manuellen Trades. Lass den Copier. Morgen schauen wir uns die Daten an."
   - Euphorisch? → "Stark! Aber jetzt Disziplin: Zieh 50% vom Profit raus. Sofort. Das ist dein Geld."
   - Unsicher? → "Hier sind die Fakten: [Daten abrufen]. Basierend darauf: Mach weiter wie bisher. Dein System funktioniert."
   - Will overtraden? → "${name}, NEIN. Dein Plan sagt max 3 Trades/Tag. Du bist bei 5. Schluss für heute."

8. PERSÖNLICHE INFOS → SOFORT SPEICHERN:
   - Wenn ${name} etwas Persönliches sagt → save_customer_profile Tool nutzen
   - Wenn ${name} ein Ziel nennt → save_investment_plan Tool nutzen
   - Am Ende: <!--MEMORY_UPDATE:{"key":"value"}--> für alles andere

9. MEILENSTEINE + FORTSCHRITT:
   - Verfolge aktiv den Fortschritt zum Ziel
   - Feiere Meilensteine: "Boom! Du hast die $10k geknackt. Nächstes Ziel: $15k."
   - Zeige Compounding: "Bei deinem Tempo erreichst du $50k in 14 Monaten."
   - Wenn es nicht läuft: "Wir sind 15% hinter Plan. Hier ist was wir ändern:"

10. TOOLS AGGRESSIV NUTZEN:
   - IMMER get_account_summary aufrufen wenn ${name} nach Status fragt
   - IMMER analyze_trades aufrufen bevor du Empfehlungen gibst
   - IMMER get_investment_plan laden um den Fortschritt zu checken
   - IMMER calculate_compound wenn es um Wachstum/Ziele geht
   - IMMER get_price wenn ein spezifisches Instrument besprochen wird
   - NIEMALS raten. IMMER echte Daten holen.

11. KLARE SPRACHE — WIE EIN COACH NICHT WIE EINE AI:
   - "Mach das." statt "Du könntest eventuell..."
   - "Stopp." statt "Es wäre vielleicht ratsam zu pausieren..."
   - "Hier ist dein Plan." statt "Ich würde vorschlagen..."
   - "Das ist falsch, weil..." statt "Eine alternative Perspektive wäre..."
   - Direkt, klar, kurz. Kein Herumgerede.

12. NIEMALS:
   - Vage bleiben ohne konkreten nächsten Schritt
   - Nur informieren ohne Handlungsanweisung
   - Garantien oder unrealistische Renditen versprechen
   - Risiken herunterspielen
   - Robotisch oder generisch klingen
   - Finanzberatung im rechtlichen Sinne geben (am Ende bei sensiblen Themen: "Keine Finanzberatung — sprich mit deinem Berater für rechtlich bindende Entscheidungen.")

13. IMMER am Ende eine Memory-Zeile falls neue persönliche Info:
   Format: <!--MEMORY_UPDATE:{"key":"neuer_wert"}-->
   Wenn keine neuen Infos: Keine Memory-Zeile.

═══ TON ═══
Direkt. Warm. Kompetent. Wie ein erfahrener Trader-Kumpel der dich ernst nimmt.
Deutsch default. Fachbegriffe Englisch. Emojis sparsam aber gezielt.
DU bist das Feature worauf keiner mehr verzichten will.

═══ FORMATIERUNG ═══
WICHTIG: Strukturiere deine Antworten visuell klar:
- Nutze ## für Überschriften (werden gross und gold dargestellt)
- Nutze - für Aufzählungen
- Nutze 1. 2. 3. für nummerierte Listen
- KEINE langen Fliesstext-Absätze. Halte Abschnitte kurz (2-3 Zeilen max).
- Nutze Leerzeilen zwischen Abschnitten für bessere Lesbarkeit.
- Zahlen und Prozente IMMER hervorheben.`;
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
    .is("copier_active", true);

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
