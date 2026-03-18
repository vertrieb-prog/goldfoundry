// src/lib/mlm/affiliate-notifications.ts
// ============================================================
// Instant Affiliate Notifications
// Jeder Affiliate wird SOFORT informiert wenn etwas passiert
// ============================================================

const RESEND_KEY = process.env.RESEND_API_KEY ?? "";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function sendMail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) {
    console.log(`[AFFILIATE-NOTIFY] SIMULATED → ${to}: ${subject}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Marcus von Gold Foundry <marcus@goldfoundry.de>", to, subject, html }),
  });
}

function wrap(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Outfit',Helvetica,sans-serif;background:#0a0908;color:#c4b68a;padding:40px 20px;">
<div style="max-width:600px;margin:0 auto;">
<div style="margin-bottom:24px;">
  <span style="font-size:11px;letter-spacing:2px;color:#5a4f3a;">GOLD FOUNDRY PARTNER PROGRAM</span>
</div>
${content}
<div style="margin-top:32px;text-align:center;">
  <a href="https://goldfoundry.de/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#d4a537,#8a6a1a);color:#0a0908;font-weight:600;text-decoration:none;border-radius:2px;">Zum Dashboard →</a>
</div>
<div style="margin-top:36px;padding-top:16px;border-top:1px solid #2a2218;font-size:11px;color:#3a3228;">
  Marcus Steiner · Head of Partnerships · Gold Foundry<br>
  <span style="color:#5a4f3a;">Diese Nachricht wurde automatisch gesendet.</span>
</div></div></body></html>`;
}

// ── Neuer Signup über deinen Link ─────────────────────────────
export async function notifyNewReferralSignup(
  affiliateEmail: string,
  affiliateName: string,
  newUserName: string,
  newUserEmail: string,
  totalReferrals: number
) {
  const safeName = escapeHtml(newUserName);
  const safeEmail = escapeHtml(newUserEmail);
  const safeAffName = escapeHtml(affiliateName);
  await sendMail(
    affiliateEmail,
    `Neuer Signup: ${safeName} hat sich über deinen Link registriert!`,
    wrap(`
      <h2 style="color:#d4a537;font-size:20px;margin:0 0 16px;">Hey ${safeAffName}!</h2>
      <p style="color:#a09070;line-height:1.7;font-size:14px;">
        Gerade eben hat sich <strong style="color:#e8dcc0;">${safeName}</strong> über deinen Referral-Link registriert.
      </p>
      <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.15);border-radius:4px;padding:16px;margin:20px 0;">
        <p style="margin:4px 0;color:#a09070;">→ Name: <strong style="color:#e8dcc0;">${safeName}</strong></p>
        <p style="margin:4px 0;color:#a09070;">→ E-Mail: <strong style="color:#e8dcc0;">${safeEmail}</strong></p>
        <p style="margin:4px 0;color:#a09070;">→ Deine Referrals gesamt: <strong style="color:#d4a537;">${totalReferrals}</strong></p>
      </div>
      <p style="color:#a09070;font-size:14px;">
        Sobald ${escapeHtml(newUserName.split(" ")[0])} ein Abo abschließt, verdienst du automatisch deine Provision.
        Bleib dran — jeder Signup bringt dich näher ans nächste Tier!
      </p>
    `)
  );
}

// ── Referral hat Abo abgeschlossen (GELD!) ────────────────────
export async function notifyReferralConverted(
  affiliateEmail: string,
  affiliateName: string,
  newUserName: string,
  tier: string,
  commissionAmount: number,
  newBalance: number,
  level: number
) {
  const levelLabel = level === 1 ? "Direkt" : level === 2 ? "Level 2" : "Level 3";
  const safeName = escapeHtml(newUserName);
  const safeAffName = escapeHtml(affiliateName);
  const safeTier = escapeHtml(tier);
  await sendMail(
    affiliateEmail,
    `+${commissionAmount.toFixed(2)} EUR Provision! ${newUserName} hat ein ${tier}-Abo abgeschlossen`,
    wrap(`
      <h2 style="color:#d4a537;font-size:20px;margin:0 0 16px;">${safeAffName}, du hast gerade Geld verdient!</h2>
      <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.15);border-radius:4px;padding:20px;margin:20px 0;text-align:center;">
        <div style="font-size:36px;font-weight:700;color:#d4a537;">+${commissionAmount.toFixed(2)} EUR</div>
        <div style="font-size:12px;color:#5a4f3a;margin-top:4px;">${levelLabel}-Provision</div>
      </div>
      <p style="color:#a09070;line-height:1.7;font-size:14px;">
        <strong style="color:#e8dcc0;">${safeName}</strong> hat gerade das <strong style="color:#d4a537;">${safeTier.toUpperCase()}</strong>-Abo abgeschlossen.
        Deine Provision von <strong style="color:#d4a537;">${commissionAmount.toFixed(2)} EUR</strong> wurde deinem Guthaben gutgeschrieben.
      </p>
      <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.1);border-radius:4px;padding:12px 16px;margin:16px 0;">
        <p style="margin:0;color:#a09070;">Dein aktuelles Guthaben: <strong style="color:#d4a537;font-size:18px;">${newBalance.toFixed(2)} EUR</strong></p>
      </div>
      <p style="color:#a09070;font-size:14px;">
        Das ist passives Einkommen — jeden Monat, solange ${escapeHtml(newUserName.split(" ")[0])} dabei bleibt.
        Und: wenn ${escapeHtml(newUserName.split(" ")[0])} selbst Leute bringt, verdienst du auf Level 2 mit!
      </p>
    `)
  );
}

// ── Tier Upgrade ──────────────────────────────────────────────
export async function notifyTierUpgrade(
  affiliateEmail: string,
  affiliateName: string,
  oldTier: string,
  newTier: string,
  newL1Rate: number,
  activeReferrals: number
) {
  await sendMail(
    affiliateEmail,
    `Tier-Upgrade! Du bist jetzt ${escapeHtml(newTier).toUpperCase()}-Partner!`,
    wrap(`
      <h2 style="color:#d4a537;font-size:22px;margin:0 0 16px;">Glückwunsch, ${escapeHtml(affiliateName)}!</h2>
      <p style="color:#a09070;line-height:1.7;font-size:14px;">
        Du hast es geschafft! Mit <strong style="color:#d4a537;">${activeReferrals} aktiven Referrals</strong> 
        steigst du auf von <span style="color:#5a4f3a;">${escapeHtml(oldTier).toUpperCase()}</span> auf:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,rgba(212,165,55,0.15),rgba(212,165,55,0.05));border:2px solid #d4a537;border-radius:4px;">
          <div style="font-size:28px;font-weight:700;color:#d4a537;letter-spacing:3px;">${escapeHtml(newTier).toUpperCase()}</div>
          <div style="font-size:11px;color:#8a7a5a;margin-top:4px;">PARTNER TIER</div>
        </div>
      </div>
      <p style="color:#a09070;font-size:14px;">Das heißt für dich:</p>
      <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.1);border-radius:4px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;color:#a09070;">→ Level 1 Provision: <strong style="color:#d4a537;">${(newL1Rate * 100).toFixed(0)}%</strong> (vorher weniger)</p>
        <p style="margin:4px 0;color:#a09070;">→ Alle Ebenen steigen proportional</p>
        <p style="margin:4px 0;color:#a09070;">→ Rückwirkend auf ALLE deine aktiven Referrals</p>
      </div>
      <p style="color:#a09070;font-size:14px;">Ab jetzt verdienst du mehr — bei jedem einzelnen Referral. Weiter so! 🚀</p>
    `)
  );
}

// ── Payout verarbeitet ────────────────────────────────────────
export async function notifyPayoutProcessed(
  affiliateEmail: string,
  affiliateName: string,
  amount: number,
  method: string,
  status: "completed" | "rejected",
  rejectionReason?: string
) {
  const isApproved = status === "completed";
  await sendMail(
    affiliateEmail,
    isApproved
      ? `✅ $${amount.toFixed(2)} ausgezahlt! Dein Geld ist unterwegs.`
      : `❌ Auszahlung abgelehnt — bitte prüfe deine Daten`,
    wrap(isApproved ? `
      <h2 style="color:#d4a537;font-size:20px;margin:0 0 16px;">${escapeHtml(affiliateName)}, dein Geld ist raus!</h2>
      <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.15);border-radius:4px;padding:20px;margin:20px 0;text-align:center;">
        <div style="font-size:32px;font-weight:700;color:#d4a537;">$${amount.toFixed(2)}</div>
        <div style="font-size:11px;color:#5a4f3a;margin-top:4px;">via ${method.toUpperCase()}</div>
      </div>
      <p style="color:#a09070;font-size:14px;">
        Die Auszahlung wurde verarbeitet. Je nach Methode dauert es 1-3 Werktage bis das Geld ankommt.
        Weiter so — dein nächster Payout wartet schon! 💪
      </p>
    ` : `
      <h2 style="color:#c0392b;font-size:20px;margin:0 0 16px;">Auszahlung abgelehnt</h2>
      <p style="color:#a09070;font-size:14px;">
        Deine Auszahlung über <strong>$${amount.toFixed(2)}</strong> konnte nicht verarbeitet werden.
      </p>
      <div style="background:rgba(192,57,43,0.08);border:1px solid rgba(192,57,43,0.2);border-radius:4px;padding:12px 16px;margin:16px 0;">
        <p style="margin:0;color:#c0392b;">Grund: ${escapeHtml(rejectionReason ?? "Bitte kontaktiere den Support.")}</p>
      </div>
      <p style="color:#a09070;font-size:14px;">Der Betrag wurde deinem Guthaben wieder gutgeschrieben. Bitte prüfe deine Zahlungsdaten.</p>
    `)
  );
}

// ── Wöchentlicher Earnings-Report ─────────────────────────────
export async function notifyWeeklyEarnings(
  affiliateEmail: string,
  affiliateName: string,
  weekEarnings: number,
  weekSignups: number,
  weekConversions: number,
  totalBalance: number,
  rank: number,
  totalAffiliates: number
) {
  await sendMail(
    affiliateEmail,
    weekEarnings > 0
      ? `📊 Dein Wochen-Report: +$${weekEarnings.toFixed(2)} verdient!`
      : `📊 Dein Wochen-Report — lass uns nächste Woche durchstarten!`,
    wrap(`
      <h2 style="color:#d4a537;font-size:20px;margin:0 0 16px;">Hey ${escapeHtml(affiliateName)}, hier ist dein Wochen-Report:</h2>
      <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.1);border-radius:4px;padding:20px;margin:20px 0;">
        <div style="display:flex;justify-content:space-around;text-align:center;">
          <div>
            <div style="font-size:24px;font-weight:700;color:${weekEarnings > 0 ? '#d4a537' : '#5a4f3a'};">$${weekEarnings.toFixed(2)}</div>
            <div style="font-size:10px;color:#5a4f3a;margin-top:2px;">VERDIENT</div>
          </div>
          <div>
            <div style="font-size:24px;font-weight:700;color:#e8dcc0;">${weekSignups}</div>
            <div style="font-size:10px;color:#5a4f3a;margin-top:2px;">SIGNUPS</div>
          </div>
          <div>
            <div style="font-size:24px;font-weight:700;color:#d4a537;">${weekConversions}</div>
            <div style="font-size:10px;color:#5a4f3a;margin-top:2px;">CONVERSIONS</div>
          </div>
        </div>
      </div>
      <p style="color:#a09070;font-size:14px;">
        Dein Guthaben: <strong style="color:#d4a537;">$${totalBalance.toFixed(2)}</strong><br>
        Dein Ranking: <strong style="color:#e8dcc0;">#${rank}</strong> von ${totalAffiliates} Partnern
      </p>
      ${weekEarnings === 0 ? `
      <div style="background:rgba(212,165,55,0.05);border-radius:4px;padding:14px;margin:16px 0;">
        <p style="margin:0;color:#a09070;font-size:13px;">
          💡 <strong style="color:#d4a537;">Tipp von Marcus:</strong> Poste deinen Referral-Link diese Woche 
          in 2-3 Instagram Stories mit einem kurzen Erfahrungsbericht. 
          Unsere Top-Affiliates machen 80% ihrer Conversions über Stories.
        </p>
      </div>` : `
      <p style="color:#a09070;font-size:14px;">Stark! Bleib dran — du bist auf einem guten Weg. 🔥</p>`}
    `)
  );
}
