// src/lib/mlm/upline-push.ts
// ============================================================
// UPLINE PUSH ENGINE — Motiviert die Upline ihre Leute zu KONTAKTIEREN
// 
// Synergiert mit: CRM, Affiliate, Notifications, Marcus (Sales Director)
// 
// Triggert bei:
// - Neuer Signup → "RUFF IHN AN! Hier sind seine Daten + Gesprächsleitfaden"
// - 48h kein Login → "Dein Referral droht abzuspringen. JETZT kontaktieren."
// - Nicht bezahlt nach 3 Tagen → "Er hat noch kein Abo. Hier ist dein Pitch."
// - Copier pausiert → "Sein Account hat ein Problem. Hilf ihm."
// - Erfolg → "Dein Referral hat +$X gemacht! Gratuliere ihm → Bindung stärken."
// ============================================================

import { supabaseAdmin } from "@/lib/supabase-admin";
import { logCommunication, logActivity } from "@/lib/crm/crm-engine";
import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
const log = (msg: string) => console.log(`[${new Date().toISOString()}] [UPLINE-PUSH] ${msg}`);

const RESEND_KEY = process.env.RESEND_API_KEY ?? "";

async function sendPushMail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) { log(`SIMULATED → ${to}: ${subject}`); return; }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Marcus von Gold Foundry <marcus@goldfoundry.de>", to, subject, html }),
  });
}

function wrap(content: string): string {
  return `<!DOCTYPE html><html><body style="font-family:'Outfit',sans-serif;background:#0a0908;color:#c4b68a;padding:32px 16px;">
<div style="max-width:560px;margin:0 auto;">
<div style="font-size:10px;letter-spacing:2px;color:#5a4f3a;margin-bottom:16px;">GOLD FOUNDRY · UPLINE ACTION REQUIRED</div>
${content}
<div style="margin-top:28px;text-align:center;"><a href="https://goldfoundry.de/dashboard/affiliate" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#d4a537,#8a6a1a);color:#0a0908;font-weight:600;text-decoration:none;border-radius:2px;font-size:13px;">Zum Partner-Dashboard →</a></div>
<div style="margin-top:28px;padding-top:14px;border-top:1px solid rgba(212,165,55,0.08);font-size:10px;color:#3a3228;">Marcus Steiner · Head of Partnerships · Gold Foundry</div>
</div></body></html>`;
}

// ══════════════════════════════════════════════════════════════
// PUSH TRIGGERS — Jeder Trigger sendet eine Action-Mail an die Upline
// ══════════════════════════════════════════════════════════════

// ── 1. Neuer Signup → "RUF IHN JETZT AN!" ────────────────────
export async function pushNewSignup(referrerUserId: string, newUser: {
  name: string; email: string; phone?: string;
}) {
  const db = supabaseAdmin;
  const { data: referrer } = await db.from("profiles")
    .select("email, full_name").eq("id", referrerUserId).single();
  if (!referrer) return;

  // Generate talking points with AI
  const talkingPoints = await generateTalkingPoints("new_signup", newUser.name);

  await sendPushMail(referrer.email,
    `🔔 ACTION: ${newUser.name} hat sich über deinen Link registriert — JETZT kontaktieren!`,
    wrap(`
      <h2 style="color:#d4a537;font-size:18px;margin:0 0 12px;">${referrer.full_name}, du hast einen neuen Referral!</h2>
      <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.12);border-radius:4px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;color:#a09070;">Name: <strong style="color:#e8dcc0;">${newUser.name}</strong></p>
        <p style="margin:4px 0;color:#a09070;">E-Mail: <strong style="color:#e8dcc0;">${newUser.email}</strong></p>
        ${newUser.phone ? `<p style="margin:4px 0;color:#a09070;">Telefon: <strong style="color:#d4a537;">${newUser.phone}</strong></p>` : ""}
      </div>
      <div style="background:rgba(212,165,55,0.04);border-radius:4px;padding:14px;margin:16px 0;">
        <p style="color:#d4a537;font-weight:600;margin:0 0 8px;font-size:13px;">⚡ Was du JETZT tun solltest:</p>
        <p style="color:#a09070;font-size:12px;line-height:1.7;margin:0;">
          1. <strong style="color:#e8dcc0;">Innerhalb von 2 Stunden kontaktieren</strong> — je schneller, desto höher die Conversion<br/>
          2. Frag: "Was tradest du? Welche Prop-Firm?" → zeig ihm den passenden Plan<br/>
          3. Biete an beim Onboarding zu helfen → "Ich zeig dir in 5 Min wie der Copier funktioniert"
        </p>
      </div>
      <div style="background:#110f0a;border:1px solid rgba(212,165,55,0.08);border-radius:4px;padding:14px;margin:16px 0;">
        <p style="color:#5a4f3a;font-size:10px;letter-spacing:1px;margin:0 0 8px;">GESPRÄCHSLEITFADEN</p>
        <p style="color:#a09070;font-size:12px;line-height:1.8;margin:0;">${talkingPoints}</p>
      </div>
      <p style="color:#a09070;font-size:12px;">Die ersten 48h entscheiden ob ${newUser.name.split(" ")[0]} bleibt oder geht. <strong style="color:#d4a537;">Jede Minute zählt.</strong></p>
    `)
  );

  // Log in CRM
  const { data: contact } = await db.from("crm_contacts").select("id").eq("email", newUser.email).single();
  if (contact) {
    await logActivity(contact.id, "referral_signup", `Upline ${referrer.full_name} wurde benachrichtigt: Neuer Signup ${newUser.name}`);
  }

  log(`Push: NEW_SIGNUP → ${referrer.email} (Referral: ${newUser.name})`);
}

// ── 2. Inaktiv 48h → "Er springt ab!" ────────────────────────
export async function pushInactiveReferral(referrerUserId: string, referral: {
  name: string; email: string; daysSinceLogin: number;
}) {
  const db = supabaseAdmin;
  const { data: referrer } = await db.from("profiles")
    .select("email, full_name").eq("id", referrerUserId).single();
  if (!referrer) return;

  await sendPushMail(referrer.email,
    `⚠️ ${referral.name} war ${referral.daysSinceLogin} Tage nicht online — droht abzuspringen!`,
    wrap(`
      <h2 style="color:#f39c12;font-size:18px;margin:0 0 12px;">Achtung ${referrer.full_name} — Referral inaktiv!</h2>
      <p style="color:#a09070;font-size:13px;line-height:1.7;"><strong style="color:#e8dcc0;">${referral.name}</strong> hat sich seit <strong style="color:#f39c12;">${referral.daysSinceLogin} Tagen</strong> nicht eingeloggt.</p>
      <div style="background:rgba(243,156,18,0.06);border:1px solid rgba(243,156,18,0.15);border-radius:4px;padding:14px;margin:16px 0;">
        <p style="color:#f39c12;font-weight:600;margin:0 0 6px;font-size:13px;">Was du tun kannst:</p>
        <p style="color:#a09070;font-size:12px;line-height:1.7;margin:0;">
          → Schick eine kurze WhatsApp/DM: "Hey, alles klar bei dir? Dein Copier läuft noch..."<br/>
          → Teile ein aktuelles Ergebnis: "Gestern +$X mit dem AI Copier — du verpasst was!"<br/>
          → Biete einen Call an: "Lass uns 10 Min reden, ich zeig dir die neuen Features"
        </p>
      </div>
      <p style="color:#a09070;font-size:11px;">Kontakt: ${referral.email}</p>
    `)
  );
  log(`Push: INACTIVE → ${referrer.email} (Referral: ${referral.name}, ${referral.daysSinceLogin}d)`);
}

// ── 3. Nicht bezahlt nach Signup → "Hilf ihm beim Abschluss" ──
export async function pushNoPurchase(referrerUserId: string, referral: {
  name: string; email: string; daysSinceSignup: number;
}) {
  const db = supabaseAdmin;
  const { data: referrer } = await db.from("profiles")
    .select("email, full_name").eq("id", referrerUserId).single();
  if (!referrer) return;

  const commission = 29 * 0.30; // Copier tier × 30% L1

  await sendPushMail(referrer.email,
    `💰 ${referral.name} hat noch kein Abo — $${commission.toFixed(0)}/Monat Provision wartet auf dich!`,
    wrap(`
      <h2 style="color:#d4a537;font-size:18px;margin:0 0 12px;">${referrer.full_name}, da liegt Geld auf dem Tisch!</h2>
      <p style="color:#a09070;font-size:13px;line-height:1.7;"><strong style="color:#e8dcc0;">${referral.name}</strong> hat sich vor ${referral.daysSinceSignup} Tagen registriert aber noch kein Abo abgeschlossen.</p>
      <div style="text-align:center;margin:20px 0;">
        <div style="display:inline-block;padding:12px 24px;background:#110f0a;border:1px solid rgba(212,165,55,0.15);border-radius:4px;">
          <span style="font-size:24px;font-weight:700;color:#d4a537;">$${commission.toFixed(0)}</span>
          <span style="font-size:11px;color:#5a4f3a;display:block;margin-top:2px;">deine monatliche Provision</span>
        </div>
      </div>
      <div style="background:rgba(212,165,55,0.04);border-radius:4px;padding:14px;margin:16px 0;">
        <p style="color:#d4a537;font-weight:600;margin:0 0 6px;font-size:13px;">Closing-Tipps:</p>
        <p style="color:#a09070;font-size:12px;line-height:1.7;margin:0;">
          → "Der Copier-Tier ist nur $29/Monat — günstiger als ein Starbucks pro Tag"<br/>
          → "Du kannst jederzeit kündigen, kein Vertrag"<br/>
          → "Zeig ihm deine eigenen Ergebnisse — Social Proof wirkt am besten"<br/>
          → "Biete an gemeinsam den ersten Account zu verbinden — 5 Min"
        </p>
      </div>
    `)
  );
  log(`Push: NO_PURCHASE → ${referrer.email} (Referral: ${referral.name})`);
}

// ── 4. Referral hat Profit gemacht → "Gratuliere ihm!" ────────
export async function pushReferralSuccess(referrerUserId: string, referral: {
  name: string; email: string; profit: number; period: string;
}) {
  const db = supabaseAdmin;
  const { data: referrer } = await db.from("profiles")
    .select("email, full_name").eq("id", referrerUserId).single();
  if (!referrer) return;

  await sendPushMail(referrer.email,
    `🎉 ${referral.name} hat +$${referral.profit.toFixed(0)} gemacht — gratuliere ihm!`,
    wrap(`
      <h2 style="color:#27ae60;font-size:18px;margin:0 0 12px;">Dein Referral performt!</h2>
      <p style="color:#a09070;font-size:13px;line-height:1.7;"><strong style="color:#e8dcc0;">${referral.name}</strong> hat ${referral.period} <strong style="color:#27ae60;">+$${referral.profit.toFixed(0)}</strong> Profit gemacht.</p>
      <div style="background:rgba(39,174,96,0.06);border-radius:4px;padding:14px;margin:16px 0;">
        <p style="color:#27ae60;font-weight:600;margin:0 0 6px;font-size:13px;">Warum du JETZT gratulieren solltest:</p>
        <p style="color:#a09070;font-size:12px;line-height:1.7;margin:0;">
          → Stärkt die Bindung → er bleibt länger → du verdienst länger<br/>
          → Frag ob er Leute kennt die auch profitieren wollen → Dein L2 wächst<br/>
          → "Hey, krass! $${referral.profit.toFixed(0)} diese Woche — der Copier liefert!"
        </p>
      </div>
    `)
  );
  log(`Push: SUCCESS → ${referrer.email} (Referral: ${referral.name}, +$${referral.profit.toFixed(0)})`);
}

// ── 5. Copier pausiert → "Sein Account hat ein Problem" ───────
export async function pushCopierPaused(referrerUserId: string, referral: {
  name: string; email: string; reason: string; account: string;
}) {
  const db = supabaseAdmin;
  const { data: referrer } = await db.from("profiles")
    .select("email, full_name").eq("id", referrerUserId).single();
  if (!referrer) return;

  await sendPushMail(referrer.email,
    `⚠️ Copier von ${referral.name} pausiert — er braucht vielleicht Hilfe`,
    wrap(`
      <h2 style="color:#f39c12;font-size:18px;margin:0 0 12px;">Referral braucht Support</h2>
      <p style="color:#a09070;font-size:13px;line-height:1.7;">Der Copier von <strong style="color:#e8dcc0;">${referral.name}</strong> wurde auf Account <strong>${referral.account}</strong> pausiert.</p>
      <div style="background:#110f0a;border:1px solid rgba(243,156,18,0.15);border-radius:4px;padding:12px;margin:12px 0;">
        <p style="margin:0;color:#f39c12;font-size:12px;">Grund: ${referral.reason}</p>
      </div>
      <p style="color:#a09070;font-size:12px;">Schick ihm eine kurze Nachricht: "Hey, ich hab gesehen dein Copier ist pausiert — kann ich helfen?" Das zeigt dass du dich kümmerst und stärkt die Bindung.</p>
    `)
  );
  log(`Push: COPIER_PAUSED → ${referrer.email} (Referral: ${referral.name})`);
}

// ══════════════════════════════════════════════════════════════
// AI-GENERATED TALKING POINTS
// ══════════════════════════════════════════════════════════════

async function generateTalkingPoints(scenario: string, referralName: string): Promise<string> {
  try {
    const text = await cachedCall({
      prompt: "Du generierst Gesprächsleitfäden für Affiliate-Partner die ihre Referrals anrufen. Kurz, natürlich, nicht robotisch. 4-5 Bulletpoints. Deutsch.",
      message: `Szenario: ${scenario}. Referral Name: ${referralName}. Generiere Gesprächsleitfaden.`,
      model: MODELS.fast,
      maxTokens: 300,
    });
    return text || "Frag nach seiner Trading-Erfahrung und zeig ihm den Copier.";
  } catch {
    return "→ Frag was er tradet und welche Prop-Firm er nutzt\n→ Zeig ihm den AI Copier und die 7 Schutzfaktoren\n→ Biete an beim Setup zu helfen\n→ Erwähne deine eigenen Ergebnisse";
  }
}

// ══════════════════════════════════════════════════════════════
// DAILY UPLINE PUSH SCAN — Cron (Mo-Fr 09:00)
// ══════════════════════════════════════════════════════════════

export async function runDailyUplinePush(): Promise<{
  inactivePushes: number;
  noPurchasePushes: number;
  successPushes: number;
  copierPushes: number;
}> {
  const db = supabaseAdmin;
  let inactivePushes = 0, noPurchasePushes = 0, successPushes = 0, copierPushes = 0;

  // Get all referred users
  const { data: referredUsers } = await db.from("profiles")
    .select("id, email, full_name, referred_by, subscription_active, subscription_tier, created_at")
    .not("referred_by", "is", null);

  if (!referredUsers?.length) return { inactivePushes, noPurchasePushes, successPushes, copierPushes };

  for (const user of referredUsers) {
    const daysSinceSignup = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000);

    // Check last login (approximate via last chat message or trade)
    const { data: lastActivity } = await db.from("chat_messages")
      .select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);

    const lastActive = lastActivity?.[0]?.created_at ?? user.created_at;
    const daysSinceLogin = Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000);

    // ── Inactive 48h+ ──
    if (daysSinceLogin >= 2 && daysSinceLogin <= 7) {
      await pushInactiveReferral(user.referred_by, {
        name: user.full_name ?? user.email, email: user.email, daysSinceLogin,
      });
      inactivePushes++;
    }

    // ── No purchase after 3 days ──
    if (!user.subscription_active && user.subscription_tier === "free" && daysSinceSignup >= 3 && daysSinceSignup <= 14) {
      await pushNoPurchase(user.referred_by, {
        name: user.full_name ?? user.email, email: user.email, daysSinceSignup,
      });
      noPurchasePushes++;
    }

    // ── Weekly profit > $100 → congrats push ──
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: weekTrades } = await db.from("trades")
      .select("profit").eq("user_id", user.id).gte("close_time", weekAgo);
    const weekProfit = (weekTrades ?? []).reduce((s, t) => s + Number(t.profit), 0);

    if (weekProfit > 100) {
      await pushReferralSuccess(user.referred_by, {
        name: user.full_name ?? user.email, email: user.email,
        profit: weekProfit, period: "diese Woche",
      });
      successPushes++;
    }

    // ── Copier paused ──
    const { data: pausedAccounts } = await db.from("slave_accounts")
      .select("firm_profile, copier_paused_reason")
      .eq("user_id", user.id).eq("copier_active", false)
      .not("copier_paused_reason", "is", null);

    for (const acc of pausedAccounts ?? []) {
      await pushCopierPaused(user.referred_by, {
        name: user.full_name ?? user.email, email: user.email,
        reason: acc.copier_paused_reason!, account: acc.firm_profile,
      });
      copierPushes++;
    }
  }

  log(`Daily Push: ${inactivePushes} inactive, ${noPurchasePushes} no-purchase, ${successPushes} success, ${copierPushes} copier-paused`);
  return { inactivePushes, noPurchasePushes, successPushes, copierPushes };
}
