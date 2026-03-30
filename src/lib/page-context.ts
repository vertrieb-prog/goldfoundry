// src/lib/page-context.ts
// ============================================================
// Page Context — Der Chat-Agent weiß GENAU was der User gerade sieht
// Wird bei jeder Chat-Nachricht mitgeschickt
// ============================================================

export interface PageContext {
  page: string;        // z.B. "/dashboard", "/dashboard/copier", "/pricing"
  view?: string;       // z.B. "Command Center", "Smart Copier"
  visibleData?: Record<string, any>; // Was der User auf dem Screen sieht
}

// Maps page paths to intelligent guidance
export function getPageGuidance(ctx: PageContext): string {
  const p = ctx.page;

  if (p === "/" || p === "") return `
Der User ist auf der LANDING PAGE. Er ist wahrscheinlich neu oder noch nicht eingeloggt.
→ Erkläre was Gold Foundry ist und warum es einzigartig ist
→ Führe ihn zum Registrieren oder Einloggen
→ Zeig die 3 stärksten Features: Smart Copier, Shield, Strategy Lab
→ "Klick oben rechts auf 'Starten' — in 2 Minuten hast du deinen Account."`;

  if (p === "/dashboard") return `
Der User ist im COMMAND CENTER (Hauptdashboard).
→ Er sieht: KPI-Cards (Equity, P&L, DD-Buffer, Win Rate, Trades), Equity Curve, Risk Score, Session Performance, Events
→ Erkläre was die Zahlen bedeuten wenn er fragt
→ Bei DD-Buffer unter 40%: Proaktiv warnen
→ Bei Events heute: Erwähne dass der Copier automatisch pausiert
→ "Deine Equity Curve zeigt den Verlauf der letzten 90 Tage. Der goldene Bereich ist dein Profit."`;

  if (p === "/dashboard/copier") return `
Der User schaut den SMART COPIER an.
→ Er sieht: 7-Faktor Multiplier Balken, Account-Cards, Risk Radar
→ Erkläre jeden Faktor wenn er fragt: TIME (Nacht-Boost), NEWS (Auto-Pause), DD (Buffer-Schutz), etc.
→ Wenn ein Account pausiert ist: Erkläre warum und wann er wieder startet
→ "Der Copier multipliziert alle 7 Faktoren. Wenn einer 0 ist → kein Trade. So schützen wir dein Geld."
→ Bei "Connect" Frage: Führe ihn durch den Onboarding-Prozess Schritt für Schritt`;

  if (p === "/dashboard/chat") return `
Der User ist im FORGE Mentor Chat.
→ Er hat den Chat explizit geöffnet → will aktiv kommunizieren
→ Sei ausführlicher als beim Widget. Gib detaillierte Analysen.
→ Frag proaktiv nach seinen Zielen wenn du sie noch nicht kennst`;

  if (p === "/dashboard/trades") return `
Der User schaut das TRADE LEDGER an.
→ Er sieht: Alle Trades mit Symbol, Typ, Lots, P&L, Session, Dauer
→ Hilf ihm Muster zu erkennen: "Deine Asian-Trades haben 78% WR, NY nur 43%"
→ Biete Analyse an: "Soll ich deine letzten 50 Trades auswerten? Ich finde wo du Geld liegen lässt."`;

  if (p === "/dashboard/settings") return `
Der User ist in den SETTINGS.
→ Hilf bei Profil-Updates, Zahlungsmethode, Notification-Einstellungen
→ Wenn Abo-Fragen: Erkläre die Unterschiede zwischen den Tiers`;

  if (p.startsWith("/auth")) return `
Der User ist auf der LOGIN/REGISTER Seite.
→ Hilf beim Einloggen oder Registrieren
→ Wenn Referral-Code vorhanden: "Du wurdest eingeladen — nach der Registrierung bist du automatisch verknüpft."
→ Bei Passwort-Problemen: "Klick auf 'Passwort vergessen' oder schreib an support@goldfoundry.de"`;

  return `Der User ist auf Seite: ${p}. Hilf ihm basierend auf dem Kontext.`;
}
