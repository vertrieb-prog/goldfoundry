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

  if (p === "/pricing") return `
Der User schaut sich die PRICING PAGE an. Er überlegt ob er zahlen soll.
→ Er sieht: 4 Abo-Tiers (Analyzer 9€, Copier 29€, Pro 79€, Provider 149€)
→ Hilf ihm den richtigen Plan zu wählen basierend auf seinen Bedürfnissen
→ Frag: "Was tradest du? Wie viele Accounts?" → empfiehl den passenden Tier
→ Betone: "Ab 29€ bekommst du den Smart Copier der dein Kapital schützt. Das ist weniger als ein verlorener Trade."
→ Wenn er zögert: "Du kannst jederzeit kündigen. Kein Vertrag."
→ Zahlung läuft über Cryptomus (Crypto) oder Stripe (Karte).`;

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

  if (p === "/dashboard/strategy") return `
Der User ist im STRATEGY LAB.
→ Er sieht: Upload-Buttons (MQL4/MQL5 + Backtest) und Analyse-Ergebnisse
→ Wenn er noch nichts hochgeladen hat: "Lade deinen EA-Code oder einen Backtest hoch — ich analysiere alles in 30 Sekunden."
→ Wenn Analyse vorhanden: Erkläre die Metriken (Sharpe, PF, WR, Monte Carlo)
→ Biete Optimierung an: "Ich kann deinen SL von 30 auf 42 Pips anpassen — historisch 23% besser."`;

  if (p === "/dashboard/affiliate") return `
Der User schaut das AFFILIATE/PARTNER Dashboard an.
→ Er sieht: Referral-Statistiken, Provision-Aufteilung, Struktur-Baum, Affiliate-Link
→ Motiviere ihn: "Jeder Referral mit Copier-Abo bringt dir 8,70€/Monat passiv."
→ Gib Marketing-Tipps: "Poste deinen Link in deine Instagram Bio + Story mit deinen Ergebnissen."
→ Wenn Guthaben > $50: "Du hast $X zum Auszahlen — vergiss nicht dein Geld abzuheben!"`;

  if (p === "/dashboard/profit") return `
Der User schaut PROFIT SHARING an.
→ Er sieht: Follower-Anzahl, AUM, seinen 60% Anteil, Settlement-History
→ Erkläre HWM wenn er fragt: "Du verdienst nur bei NEUEM Profit. Wenn die Equity fällt und wieder steigt, gibt's erst ab dem alten High wieder Geld."
→ Wenn viele Follower: "Stark! ${ctx.visibleData?.followers ?? "Deine"} Follower verwalten $${ctx.visibleData?.aum ?? "X"} — das ist echtes AUM."`;

  if (p === "/dashboard/settings") return `
Der User ist in den SETTINGS.
→ Hilf bei Profil-Updates, Zahlungsmethode, Notification-Einstellungen
→ Wenn Abo-Fragen: Erkläre die Unterschiede zwischen den Tiers`;

  if (p === "/leaderboard") return `
Der User schaut das öffentliche LEADERBOARD an.
→ Er sieht: Strategien gerankt nach Sharpe Ratio
→ Erkläre warum Sharpe besser ist als nur Profit: "Sharpe misst Profit PRO Risiko. Ein $10k Profit mit 2% DD ist besser als $20k mit 15% DD."
→ Wenn er eine Strategie kopieren will: "Klick auf 'Connect' und wähle dein Firm-Profil."`;

  if (p.startsWith("/auth")) return `
Der User ist auf der LOGIN/REGISTER Seite.
→ Hilf beim Einloggen oder Registrieren
→ Wenn Referral-Code vorhanden: "Du wurdest eingeladen — nach der Registrierung bist du automatisch verknüpft."
→ Bei Passwort-Problemen: "Klick auf 'Passwort vergessen' oder schreib an support@goldfoundry.de"`;

  return `Der User ist auf Seite: ${p}. Hilf ihm basierend auf dem Kontext.`;
}
