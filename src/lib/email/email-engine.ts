// src/lib/email/email-engine.ts
// ============================================================
// FORGE MAIL — Premium Email System
// Gold Foundry Brand · Dark Gold Design · Responsive
// Uses Resend API
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL = "forge@goldfoundry.de";
const BRAND_NAME = "Gold Foundry";
const BASE_URL = "https://goldfoundry.de";

// ── Brand Colors ─────────────────────────────────────────────
const C = {
  bg: "#08060a",
  bgCard: "#0f0d11",
  bgCardAlt: "#141218",
  gold: "#d4a537",
  goldLight: "#f5d76e",
  goldDim: "#8a6a1a",
  goldSubtle: "rgba(212,165,55,0.08)",
  goldBorder: "rgba(212,165,55,0.15)",
  text: "#e8dcc0",
  textDim: "#a09070",
  textMuted: "#5a4f3a",
  danger: "#e74c3c",
  dangerBg: "rgba(231,76,60,0.06)",
  dangerBorder: "rgba(231,76,60,0.15)",
  success: "#2ecc71",
  successBg: "rgba(46,204,113,0.06)",
  successBorder: "rgba(46,204,113,0.15)",
  divider: "#1a1520",
};

// ── Send Email ───────────────────────────────────────────────
export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[FORGE-MAIL] SIMULATED → ${to}: ${subject}`);
    return { success: true, simulated: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    }),
  });

  return response.json();
}

// ── Premium Base Template ────────────────────────────────────
function baseTemplate(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${BRAND_NAME}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <!--[if mso]><style>table,td,h1,h2,h3,div,span,p{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-size:15px;line-height:1.6;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}${"&nbsp;&zwnj;".repeat(30)}</div>` : ""}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};">
    <tr><td align="center" style="padding:32px 16px;">

      <!-- Inner container -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Logo Header -->
        <tr><td style="padding:0 0 32px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="padding:24px 40px;border-bottom:1px solid ${C.divider};">
              <div style="font-family:'Outfit','Inter',sans-serif;font-size:28px;font-weight:800;letter-spacing:3px;color:${C.gold};">GOLD FOUNDRY</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:5px;color:${C.textMuted};margin-top:6px;text-transform:uppercase;">Forge Terminal</div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Main Content Card -->
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bgCard};border:1px solid ${C.goldBorder};border-radius:12px;overflow:hidden;">
            <tr><td style="padding:40px 36px;">
              ${content}
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:32px 20px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;padding:20px 0;border-top:1px solid ${C.divider};">
              <p style="margin:0 0 8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:${C.textMuted};letter-spacing:0.5px;">
                <a href="${BASE_URL}/dashboard" style="color:${C.gold};text-decoration:none;">Dashboard</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="${BASE_URL}/dashboard/settings" style="color:${C.gold};text-decoration:none;">Settings</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="https://chat.whatsapp.com/goldfoundry" style="color:${C.gold};text-decoration:none;">WhatsApp</a>
              </p>
              <p style="margin:8px 0 0;font-family:'Inter',sans-serif;font-size:11px;color:${C.textMuted};line-height:1.6;">
                Gold Foundry · goldfoundry.de<br>
                Risikohinweis: Der Handel mit Forex und CFDs birgt ein hohes Risiko.
              </p>
            </td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── UI Components ────────────────────────────────────────────

function ctaButton(text: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr><td style="border-radius:8px;background:linear-gradient(135deg,${C.gold},${C.goldDim});">
        <a href="${href}" target="_blank" style="display:inline-block;padding:16px 40px;color:${C.bg};font-family:'JetBrains Mono','Courier New',monospace;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">
          ${text}
        </a>
      </td></tr>
    </table>`;
}

function statBox(
  label: string,
  value: string,
  color?: string
): string {
  return `
    <td style="padding:12px 16px;background:${C.bgCardAlt};border:1px solid ${C.goldBorder};border-radius:8px;text-align:center;width:33%;">
      <div style="font-family:'Outfit','Inter',sans-serif;font-size:22px;font-weight:800;color:${color || C.gold};line-height:1.2;">${value}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${C.textMuted};margin-top:4px;text-transform:uppercase;letter-spacing:1.5px;">${label}</div>
    </td>`;
}

function stepItem(
  num: number,
  text: string,
  done?: boolean
): string {
  const circleColor = done ? C.success : C.gold;
  const icon = done ? "&#10003;" : `${num}`;
  return `
    <tr><td style="padding:8px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="width:36px;vertical-align:top;">
            <div style="width:32px;height:32px;border-radius:50%;background:${done ? C.successBg : C.goldSubtle};border:2px solid ${circleColor};text-align:center;line-height:28px;font-size:13px;font-weight:700;color:${circleColor};">
              ${icon}
            </div>
          </td>
          <td style="padding-left:14px;vertical-align:middle;">
            <span style="font-size:15px;color:${done ? C.success : C.text};font-weight:500;${done ? "text-decoration:line-through;opacity:0.6;" : ""}">${text}</span>
          </td>
        </tr>
      </table>
    </td></tr>`;
}

function alertBox(
  title: string,
  body: string,
  type: "danger" | "success" | "gold"
): string {
  const bg = type === "danger" ? C.dangerBg : type === "success" ? C.successBg : C.goldSubtle;
  const border = type === "danger" ? C.dangerBorder : type === "success" ? C.successBorder : C.goldBorder;
  const titleColor = type === "danger" ? C.danger : type === "success" ? C.success : C.gold;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="background:${bg};border:1px solid ${border};border-left:4px solid ${titleColor};border-radius:8px;padding:20px 24px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${titleColor};margin:0 0 8px;text-transform:uppercase;letter-spacing:1.5px;">${title}</div>
        <div style="font-family:'Inter',sans-serif;font-size:14px;color:${C.text};line-height:1.7;">${body}</div>
      </td></tr>
    </table>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,${C.goldBorder},transparent);"></div></td></tr></table>`;
}

function heading(text: string, subtitle?: string): string {
  return `
    <h1 style="margin:0 0 ${subtitle ? "4px" : "20px"};font-family:'Outfit','Inter',sans-serif;font-size:26px;font-weight:800;color:${C.gold};line-height:1.2;letter-spacing:-0.02em;">${text}</h1>
    ${subtitle ? `<p style="margin:0 0 24px;font-family:'Inter',sans-serif;font-size:15px;color:${C.textDim};line-height:1.7;font-weight:400;">${subtitle}</p>` : ""}`;
}

function featureRow(icon: string, title: string, desc: string): string {
  return `
    <tr><td style="padding:10px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="width:44px;vertical-align:top;">
            <div style="width:40px;height:40px;border-radius:10px;background:${C.goldSubtle};border:1px solid ${C.goldBorder};text-align:center;line-height:40px;font-size:20px;">${icon}</div>
          </td>
          <td style="padding-left:14px;vertical-align:top;">
            <div style="font-family:'Outfit','Inter',sans-serif;font-size:15px;font-weight:700;color:${C.text};margin:0 0 2px;">${title}</div>
            <div style="font-family:'Inter',sans-serif;font-size:13px;color:${C.textDim};line-height:1.5;font-weight:400;">${desc}</div>
          </td>
        </tr>
      </table>
    </td></tr>`;
}

// ── TEMPLATES ────────────────────────────────────────────────

// ── Welcome Email ────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name: string) {
  const content = `
    ${heading(`Willkommen in der Forge, ${name}.`, "Dein Account ist aktiv. In 4 einfachen Schritten bist du live.")}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
      ${stepItem(1, "MetaTrader-Konto verbinden")}
      ${stepItem(2, "Firm-Profil w&auml;hlen (Tegas 24x oder Tag 12x)")}
      ${stepItem(3, "Smart Copier aktivieren")}
      ${stepItem(4, "Zur&uuml;cklehnen. Die Forge arbeitet.")}
    </table>

    ${divider()}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${featureRow("&#9889;", "Smart Copier", "Automatisch Trades kopieren mit intelligentem Risk Management.")}
      ${featureRow("&#128737;", "Risk Shield", "7-Faktor Risk Engine sch&uuml;tzt dein Kapital in Echtzeit.")}
      ${featureRow("&#129302;", "FORGE Mentor", "Dein KI-Mentor f&uuml;r Strategie und Trading-Fragen.")}
    </table>

    ${ctaButton("Dashboard &ouml;ffnen &rarr;", `${BASE_URL}/dashboard`)}
  `;

  return sendEmail(
    email,
    `Willkommen bei ${BRAND_NAME}, ${name}!`,
    baseTemplate(content, `${name}, dein Gold Foundry Account ist bereit. Starte jetzt.`)
  );
}

// ── Email Verification ──────────────────────────────────────
export async function sendVerificationEmail(
  email: string,
  name: string,
  verifyUrl: string
) {
  const content = `
    ${heading("Email best&auml;tigen", `${name}, klicke den Button um deine Email-Adresse zu verifizieren.`)}

    <div style="text-align:center;margin:32px 0;">
      <div style="width:80px;height:80px;border-radius:50%;background:${C.goldSubtle};border:2px solid ${C.goldBorder};margin:0 auto 20px;text-align:center;line-height:80px;font-size:36px;">&#9993;</div>
    </div>

    ${ctaButton("Email best&auml;tigen &rarr;", verifyUrl)}

    <p style="margin:24px 0 0;font-size:12px;color:${C.textMuted};text-align:center;line-height:1.6;">
      Falls der Button nicht funktioniert, kopiere diesen Link:<br>
      <a href="${verifyUrl}" style="color:${C.gold};word-break:break-all;font-size:11px;">${verifyUrl}</a>
    </p>
  `;

  return sendEmail(
    email,
    `${BRAND_NAME} — Email best&auml;tigen`,
    baseTemplate(content, `${name}, best&auml;tige deine Email f&uuml;r Gold Foundry.`)
  );
}

// ── Risk Alert ───────────────────────────────────────────────
export async function sendRiskAlert(
  email: string,
  name: string,
  accountLogin: string,
  ddBuffer: number,
  firmProfile: string
) {
  const severity =
    ddBuffer < 10 ? "KRITISCH" : ddBuffer < 20 ? "WARNUNG" : "VORSICHT";
  const color =
    ddBuffer < 10 ? C.danger : ddBuffer < 20 ? C.gold : C.text;
  const type = ddBuffer < 10 ? "danger" : "gold";

  const content = `
    ${heading(`Drawdown Alert: ${severity}`)}

    ${alertBox(
      `${severity} — DD-Buffer`,
      `Account <strong style="color:${C.text};">${accountLogin}</strong> (${firmProfile}) hat einen DD-Buffer von <strong style="color:${color};font-size:18px;">${ddBuffer.toFixed(1)}%</strong>.`,
      type as "danger" | "gold"
    )}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${statBox("DD-Buffer", `${ddBuffer.toFixed(1)}%`, color)}
        <td style="width:12px;"></td>
        ${statBox("Account", accountLogin)}
        <td style="width:12px;"></td>
        ${statBox("Profil", firmProfile)}
      </tr>
    </table>

    <p style="font-size:14px;color:${C.textDim};line-height:1.7;margin:24px 0 0;">
      Der <strong style="color:${C.gold};">FORGE Risk Shield</strong> hat automatisch reagiert und die Lot-Sizes reduziert, um dein Kapital zu sch&uuml;tzen.
    </p>

    ${ctaButton("Copier Status pr&uuml;fen &rarr;", `${BASE_URL}/dashboard/copier`)}
  `;

  return sendEmail(
    email,
    `${severity}: DD-Buffer bei ${ddBuffer.toFixed(1)}% — ${accountLogin}`,
    baseTemplate(content, `${severity}: Dein DD-Buffer ist bei ${ddBuffer.toFixed(1)}%. Risk Shield aktiv.`)
  );
}

// ── Weekly Performance Report ────────────────────────────────
export async function sendWeeklyReport(
  email: string,
  name: string,
  data: {
    totalPnl: number;
    trades: number;
    winRate: number;
    bestAccount: string;
    worstAccount: string;
  }
) {
  const pnlColor = data.totalPnl >= 0 ? C.success : C.danger;
  const pnlSign = data.totalPnl >= 0 ? "+" : "";

  const content = `
    ${heading(`Dein Wochen-Report`, `${name}, hier ist deine Performance-&Uuml;bersicht der letzten 7 Tage.`)}

    <!-- Hero P&L -->
    <div style="text-align:center;margin:8px 0 28px;padding:28px 20px;background:${C.bgCardAlt};border:1px solid ${C.goldBorder};border-radius:12px;">
      <div style="font-size:11px;color:${C.textMuted};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Gesamt P&amp;L</div>
      <div style="font-size:36px;font-weight:800;color:${pnlColor};letter-spacing:1px;">${pnlSign}$${data.totalPnl.toFixed(2)}</div>
    </div>

    <!-- Stats Grid -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${statBox("Trades", `${data.trades}`)}
        <td style="width:12px;"></td>
        ${statBox("Win Rate", `${data.winRate.toFixed(0)}%`, data.winRate >= 60 ? C.success : C.gold)}
        <td style="width:12px;"></td>
        ${statBox("Bester", data.bestAccount, C.success)}
      </tr>
    </table>

    ${data.worstAccount ? alertBox("Schw&auml;chster Account", `<strong>${data.worstAccount}</strong> hatte die niedrigste Performance diese Woche. Pr&uuml;fe die Einstellungen.`, "gold") : ""}

    ${ctaButton("Vollst&auml;ndige Analyse &rarr;", `${BASE_URL}/dashboard`)}
  `;

  return sendEmail(
    email,
    `Wochen-Report: ${pnlSign}$${data.totalPnl.toFixed(2)} | ${data.trades} Trades`,
    baseTemplate(content, `${name}, dein Wochen-Report: ${pnlSign}$${data.totalPnl.toFixed(2)} mit ${data.winRate.toFixed(0)}% Win Rate.`)
  );
}

// ── Payout Reminder ──────────────────────────────────────────
export async function sendPayoutReminder(
  email: string,
  name: string,
  amount: number
) {
  const content = `
    ${heading(`${name}, vergiss dein Geld nicht!`)}

    <div style="text-align:center;margin:8px 0 28px;padding:28px 20px;background:${C.successBg};border:1px solid ${C.successBorder};border-radius:12px;">
      <div style="font-size:11px;color:${C.textMuted};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Verf&uuml;gbar zur Auszahlung</div>
      <div style="font-size:36px;font-weight:800;color:${C.success};">$${amount.toFixed(2)}</div>
    </div>

    <p style="font-size:15px;color:${C.textDim};line-height:1.7;text-align:center;">
      Echte Gewinne sind die, die auf deinem Bankkonto landen.<br>
      Fordere jetzt deine Provisionen an.
    </p>

    ${ctaButton("Jetzt auszahlen &rarr;", `${BASE_URL}/dashboard/partner/earnings`)}
  `;

  return sendEmail(
    email,
    `$${amount.toFixed(2)} zum Auszahlen verfügbar!`,
    baseTemplate(content, `${name}, du hast $${amount.toFixed(2)} an Provisionen zum Auszahlen.`)
  );
}

// ── Payment Failed (Dunning) ─────────────────────────────────
export async function sendPaymentFailed(
  email: string,
  name: string,
  daysUntilSuspend: number
) {
  const content = `
    ${heading("Zahlung fehlgeschlagen")}

    ${alertBox(
      `Account wird in ${daysUntilSuspend} Tagen pausiert`,
      `${name}, deine letzte Zahlung konnte nicht verarbeitet werden. Aktualisiere deine Zahlungsmethode, um eine Unterbrechung zu vermeiden.<br><br>Bei Pausierung wird der <strong>Smart Copier automatisch gestoppt</strong>.`,
      "danger"
    )}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${statBox("Verbleibend", `${daysUntilSuspend} Tage`, C.danger)}
        <td style="width:12px;"></td>
        ${statBox("Status", "Offen", C.danger)}
        <td style="width:12px;"></td>
        ${statBox("Copier", "Aktiv", C.success)}
      </tr>
    </table>

    ${ctaButton("Zahlungsmethode aktualisieren &rarr;", `${BASE_URL}/dashboard/settings`)}
  `;

  return sendEmail(
    email,
    `Zahlung fehlgeschlagen — Account wird in ${daysUntilSuspend} Tagen pausiert`,
    baseTemplate(content, `${name}, deine Zahlung ist fehlgeschlagen. Aktualisiere deine Zahlungsmethode.`)
  );
}

// ── Re-Engagement (7 Tage inaktiv) ──────────────────────────
export async function sendReEngagement(
  email: string,
  name: string,
  botPnl: number
) {
  const pnlColor = botPnl >= 0 ? C.success : C.danger;
  const pnlSign = botPnl >= 0 ? "+" : "";

  const content = `
    ${heading(`Wir vermissen dich, ${name}.`, "W&auml;hrend du weg warst, hat der FORGE Smart Copier weiter gearbeitet:")}

    <div style="text-align:center;margin:8px 0 28px;padding:32px 20px;background:${C.bgCardAlt};border:1px solid ${C.goldBorder};border-radius:12px;">
      <div style="font-size:11px;color:${C.textMuted};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Bot Performance (7 Tage)</div>
      <div style="font-size:42px;font-weight:800;color:${pnlColor};">${pnlSign}$${botPnl.toFixed(2)}</div>
      <div style="font-size:13px;color:${C.textDim};margin-top:8px;">Automatisch. Ohne dein Zutun.</div>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${featureRow("&#128200;", "Trades laufen weiter", "Dein Copier arbeitet 24/5 — auch wenn du nicht eingeloggt bist.")}
      ${featureRow("&#128274;", "Risk Shield aktiv", "Dein Kapital wird in Echtzeit gesch&uuml;tzt.")}
    </table>

    ${ctaButton("Zur&uuml;ck zum Dashboard &rarr;", `${BASE_URL}/dashboard`)}
  `;

  return sendEmail(
    email,
    `${name}, dein Bot hat ${pnlSign}$${botPnl.toFixed(2)} gemacht — ohne dich`,
    baseTemplate(content, `Dein Smart Copier hat ${pnlSign}$${botPnl.toFixed(2)} erwirtschaftet w&auml;hrend du weg warst.`)
  );
}

// ── Partner Welcome ──────────────────────────────────────────
export async function sendPartnerWelcome(
  email: string,
  name: string,
  referralLink: string
) {
  const content = `
    ${heading(`Willkommen im Partner-Programm, ${name}.`, "Du bist jetzt offizieller Gold Foundry Partner. Bis zu 50% Provision auf jede Empfehlung.")}

    <div style="text-align:center;margin:8px 0 28px;padding:24px 20px;background:${C.goldSubtle};border:1px solid ${C.goldBorder};border-radius:12px;">
      <div style="font-size:11px;color:${C.textMuted};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Dein Affiliate Link</div>
      <div style="font-size:14px;font-weight:700;color:${C.gold};word-break:break-all;">${referralLink}</div>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${featureRow("&#128176;", "Bis zu 50% Provision", "Auf jeden Verkauf &uuml;ber deinen Link — monatlich wiederkehrend.")}
      ${featureRow("&#127942;", "Rang-Aufstiege", "Bronze → Silver → Gold → Diamond. Mehr Verk&auml;ufe = h&ouml;here Provision.")}
      ${featureRow("&#128171;", "FORGE Points", "Verdiene FP f&uuml;r jede Aktivit&auml;t. 1 FP = 0,10 &euro;.")}
    </table>

    ${ctaButton("Partner Dashboard &rarr;", `${BASE_URL}/dashboard/partner`)}
  `;

  return sendEmail(
    email,
    `Partner-Programm aktiviert — Bis zu 50% Provision`,
    baseTemplate(content, `${name}, du bist jetzt Gold Foundry Partner. Starte jetzt mit deinem Affiliate Link.`)
  );
}

// ── New Referral Notification ────────────────────────────────
export async function sendNewReferral(
  email: string,
  partnerName: string,
  referralName: string,
  plan: string
) {
  const content = `
    ${heading("Neue Empfehlung!")}

    ${alertBox(
      "Provision verdient",
      `<strong>${referralName}</strong> hat sich &uuml;ber deinen Link angemeldet und den <strong style="color:${C.gold};">${plan}</strong> Plan gew&auml;hlt.`,
      "success"
    )}

    <p style="font-size:15px;color:${C.textDim};line-height:1.7;text-align:center;">
      Weiter so, ${partnerName}! Jede Empfehlung z&auml;hlt f&uuml;r deinen Rang-Aufstieg.
    </p>

    ${ctaButton("Earnings ansehen &rarr;", `${BASE_URL}/dashboard/partner/earnings`)}
  `;

  return sendEmail(
    email,
    `Neue Empfehlung: ${referralName} hat sich angemeldet!`,
    baseTemplate(content, `${partnerName}, ${referralName} hat sich über deinen Link angemeldet.`)
  );
}
