// src/lib/email/email-engine.ts
// ============================================================
// FORGE MAIL — Automated Email System
// Welcome Series, Risk Alerts, Payout Reminders, Reports, Dunning
// Uses Resend API (swap for any provider)
// ============================================================

import { createSupabaseAdmin } from "@/lib/supabase/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL = "forge@goldfoundry.de";
const BRAND_NAME = "Gold Foundry";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[FORGE-MAIL] SIMULATED → ${to}: ${subject}`);
    return { success: true, simulated: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${BRAND_NAME} <${FROM_EMAIL}>`, to, subject, html }),
  });

  return response.json();
}

// ── Templates ─────────────────────────────────────────────────
function baseTemplate(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Outfit',Helvetica,sans-serif;background:#0a0908;color:#c4b68a;padding:40px 20px;">
<div style="max-width:600px;margin:0 auto;">
<div style="text-align:center;margin-bottom:30px;">
  <span style="font-size:24px;font-weight:700;background:linear-gradient(135deg,#d4a537,#f5e6c8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">GOLD FOUNDRY</span>
  <div style="font-size:10px;letter-spacing:3px;color:#5a4f3a;margin-top:4px;">FORGE TERMINAL</div>
</div>
${content}
<div style="margin-top:40px;padding-top:20px;border-top:1px solid #2a2218;text-align:center;font-size:11px;color:#3a3228;">
  Gold Foundry · goldfoundry.de<br>
  <a href="https://goldfoundry.de/dashboard" style="color:#d4a537;">Dashboard öffnen</a>
</div>
</div></body></html>`;
}

// ── Welcome Series ────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail(email, `Willkommen bei ${BRAND_NAME}, ${name}!`, baseTemplate(`
    <h2 style="color:#d4a537;font-size:20px;">Willkommen in der Forge, ${name}.</h2>
    <p style="line-height:1.7;color:#a09070;">Dein Account ist aktiv. Hier ist dein Schnellstart:</p>
    <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.1);border-radius:4px;padding:20px;margin:20px 0;">
      <p style="color:#d4a537;margin:0 0 8px;">→ Schritt 1: MetaTrader-Konto verbinden</p>
      <p style="color:#d4a537;margin:0 0 8px;">→ Schritt 2: Firm-Profil wählen (Tegas 24x oder Tag 12x)</p>
      <p style="color:#d4a537;margin:0 0 8px;">→ Schritt 3: AI Copier aktivieren</p>
      <p style="color:#d4a537;margin:0;">→ Schritt 4: Zurücklehnen. Die Forge arbeitet.</p>
    </div>
    <a href="https://goldfoundry.de/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#d4a537,#8a6a1a);color:#0a0908;font-weight:600;text-decoration:none;border-radius:2px;">Zum Dashboard →</a>
  `));
}

// ── Risk Alert ────────────────────────────────────────────────
export async function sendRiskAlert(email: string, name: string, accountLogin: string, ddBuffer: number, firmProfile: string) {
  const severity = ddBuffer < 10 ? "KRITISCH" : ddBuffer < 20 ? "WARNUNG" : "VORSICHT";
  const color = ddBuffer < 10 ? "#c0392b" : ddBuffer < 20 ? "#d4a537" : "#f5e6c8";

  return sendEmail(email, `⚠️ ${severity}: DD-Buffer bei ${ddBuffer.toFixed(1)}% — ${accountLogin}`, baseTemplate(`
    <div style="background:rgba(192,57,43,0.08);border:1px solid rgba(192,57,43,0.2);border-radius:4px;padding:20px;margin:20px 0;">
      <h2 style="color:${color};font-size:18px;margin:0 0 12px;">🔴 ${severity}: Drawdown-Alert</h2>
      <p style="color:#a09070;margin:0 0 8px;">Account: <strong style="color:#e8dcc0;">${accountLogin}</strong> (${firmProfile})</p>
      <p style="color:#a09070;margin:0 0 8px;">DD-Buffer: <strong style="color:${color};">${ddBuffer.toFixed(1)}%</strong></p>
      <p style="color:#a09070;margin:0;">Der FORGE COPY Autopilot hat automatisch reagiert und die Lot-Sizes reduziert.</p>
    </div>
    <a href="https://goldfoundry.de/copier" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#d4a537,#8a6a1a);color:#0a0908;font-weight:600;text-decoration:none;border-radius:2px;">Copier Status prüfen →</a>
  `));
}

// ── Weekly Performance Report ─────────────────────────────────
export async function sendWeeklyReport(email: string, name: string, data: {
  totalPnl: number; trades: number; winRate: number; bestAccount: string; worstAccount: string;
}) {
  return sendEmail(email, `📊 Dein Wochen-Report: ${data.totalPnl >= 0 ? "+" : ""}$${data.totalPnl.toFixed(2)}`, baseTemplate(`
    <h2 style="color:#d4a537;font-size:20px;">Wochenreport für ${name}</h2>
    <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.1);border-radius:4px;padding:20px;margin:20px 0;">
      <p style="color:#d4a537;font-size:24px;font-weight:700;margin:0 0 12px;">${data.totalPnl >= 0 ? "+" : ""}$${data.totalPnl.toFixed(2)}</p>
      <p style="color:#a09070;margin:4px 0;">→ ${data.trades} Trades · ${data.winRate.toFixed(0)}% Win Rate</p>
      <p style="color:#a09070;margin:4px 0;">→ Bester Account: ${data.bestAccount}</p>
      <p style="color:#a09070;margin:4px 0;">→ Schwächster: ${data.worstAccount}</p>
    </div>
    <a href="https://goldfoundry.de/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#d4a537,#8a6a1a);color:#0a0908;font-weight:600;text-decoration:none;border-radius:2px;">Vollständige Analyse →</a>
  `));
}

// ── Payout Reminder ───────────────────────────────────────────
export async function sendPayoutReminder(email: string, name: string, amount: number) {
  return sendEmail(email, `💰 $${amount.toFixed(2)} zum Auszahlen verfügbar!`, baseTemplate(`
    <h2 style="color:#d4a537;font-size:20px;">${name}, vergiss dein Geld nicht!</h2>
    <p style="color:#a09070;line-height:1.7;">Du hast <strong style="color:#d4a537;font-size:20px;">$${amount.toFixed(2)}</strong> an Provisionen zum Auszahlen.</p>
    <p style="color:#a09070;">Echte Gewinne sind die, die auf deinem Bankkonto landen.</p>
    <a href="https://goldfoundry.de/mlm" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#d4a537,#8a6a1a);color:#0a0908;font-weight:600;text-decoration:none;border-radius:2px;margin-top:16px;">Jetzt auszahlen →</a>
  `));
}

// ── Payment Failed (Dunning) ──────────────────────────────────
export async function sendPaymentFailed(email: string, name: string, daysUntilSuspend: number) {
  return sendEmail(email, `⚠️ Zahlung fehlgeschlagen — Account wird in ${daysUntilSuspend} Tagen pausiert`, baseTemplate(`
    <h2 style="color:#c0392b;font-size:20px;">Zahlung fehlgeschlagen</h2>
    <p style="color:#a09070;line-height:1.7;">${name}, deine letzte Zahlung konnte nicht verarbeitet werden. Dein Account wird in <strong style="color:#c0392b;">${daysUntilSuspend} Tagen</strong> pausiert wenn keine gültige Zahlungsmethode hinterlegt wird.</p>
    <p style="color:#a09070;">Der AI Copier wird bei Pausierung automatisch gestoppt.</p>
    <a href="https://goldfoundry.de/settings/billing" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#d4a537,#8a6a1a);color:#0a0908;font-weight:600;text-decoration:none;border-radius:2px;margin-top:16px;">Zahlungsmethode aktualisieren →</a>
  `));
}

// ── Re-Engagement (7 Tage inaktiv) ────────────────────────────
export async function sendReEngagement(email: string, name: string, botPnl: number) {
  return sendEmail(email, `${name}, dein Bot hat $${botPnl.toFixed(2)} gemacht — ohne dich`, baseTemplate(`
    <h2 style="color:#d4a537;font-size:20px;">Wir vermissen dich, ${name}.</h2>
    <p style="color:#a09070;line-height:1.7;">Während du weg warst, hat der FORGE AI Copier weiter gearbeitet:</p>
    <p style="color:#d4a537;font-size:28px;font-weight:700;margin:20px 0;">${botPnl >= 0 ? "+" : ""}$${botPnl.toFixed(2)}</p>
    <p style="color:#a09070;">Schau rein und sieh dir die Details an.</p>
    <a href="https://goldfoundry.de/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#d4a537,#8a6a1a);color:#0a0908;font-weight:600;text-decoration:none;border-radius:2px;margin-top:16px;">Zurück zum Dashboard →</a>
  `));
}
