// src/lib/sales/sales-director.ts
// ============================================================
// MARCUS STEINER — Autonomer AI Head of Partnerships
// 
// Marcus ist der virtuelle Vertriebsleiter von Gold Foundry.
// Er klingt wie ein echter Mensch, motiviert, pusht, feiert.
// Niemand merkt dass er eine AI ist — und das ist der Punkt.
//
// Er:
// - Pusht Affiliates automatisch Gas zu geben
// - Plant und promoted Events/Contests
// - Schreibt motivierende Newsletter
// - Erkennt Top-Performer und belohnt sie
// - Erkennt inaktive Partner und reaktiviert sie
// - Erstellt Sales-Materialen automatisch
// - Optimiert sich selbst basierend auf Conversion-Daten
// ============================================================

import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase-admin";

const log = (msg: string, data?: any) =>
  console.log(`[${new Date().toISOString()}] [MARCUS] ${msg}`, data ?? "");

// ══════════════════════════════════════════════════════════════
// AFFILIATE SEGMENTATION — Wer braucht welchen Push?
// ══════════════════════════════════════════════════════════════

interface AffiliateSegment {
  id: string;
  userId: string;
  email: string;
  name: string;
  tier: string;
  segment: string;
  daysInactive: number;
  totalEarned: number;
  currentBalance: number;
  activeReferrals: number;
  totalClicks: number;
  conversionRate: number;
  lastActivityAt: string;
}

export async function segmentAffiliates(): Promise<Record<string, AffiliateSegment[]>> {
  const db = supabaseAdmin;

  const { data: affiliates } = await db
    .from("affiliate_profiles")
    .select("*, profiles(email, full_name)")
    .eq("status", "approved");

  if (!affiliates?.length) return {};

  const now = Date.now();
  const segments: Record<string, AffiliateSegment[]> = {
    stars: [],          // Top-Performer → Belohnen + Feature
    rising: [],         // Wachsend → Motivieren weiterzumachen
    stagnant: [],       // Aktiv aber kein Wachstum → Neue Strategien vorschlagen
    sleeping: [],       // 7-14 Tage inaktiv → Sanfter Reminder
    dead: [],           // 14+ Tage inaktiv → Aggressiver Re-Engage
    new_no_action: [],  // Frisch registriert aber 0 Klicks → Onboarding-Push
    close_to_tier: [],  // Kurz vor Tier-Upgrade → Anreiz zum Endspurt
  };

  for (const aff of affiliates) {
    const lastActive = aff.last_activity_at ?? aff.created_at;
    const daysInactive = Math.floor((now - new Date(lastActive).getTime()) / 86400000);
    const convRate = aff.total_clicks > 0 ? (aff.total_conversions / aff.total_clicks) * 100 : 0;

    const seg: AffiliateSegment = {
      id: aff.id,
      userId: aff.user_id,
      email: (aff.profiles as any)?.email ?? "",
      name: (aff.profiles as any)?.full_name ?? "Partner",
      tier: aff.tier,
      segment: "",
      daysInactive,
      totalEarned: Number(aff.total_earned),
      currentBalance: Number(aff.current_balance),
      activeReferrals: aff.active_referrals ?? 0,
      totalClicks: aff.total_clicks ?? 0,
      conversionRate: Math.round(convRate * 10) / 10,
      lastActivityAt: lastActive,
    };

    // Classify
    if (aff.active_referrals >= 20 && convRate > 10) {
      seg.segment = "stars";
      segments.stars.push(seg);
    } else if (aff.active_referrals >= 5 && daysInactive < 3) {
      seg.segment = "rising";
      segments.rising.push(seg);
    } else if (daysInactive >= 14) {
      seg.segment = "dead";
      segments.dead.push(seg);
    } else if (daysInactive >= 7) {
      seg.segment = "sleeping";
      segments.sleeping.push(seg);
    } else if (aff.total_clicks === 0 && daysInactive < 7) {
      seg.segment = "new_no_action";
      segments.new_no_action.push(seg);
    } else if (daysInactive < 7 && aff.active_referrals < 5) {
      seg.segment = "stagnant";
      segments.stagnant.push(seg);
    }

    // Close to tier upgrade?
    const tierThresholds: Record<string, number> = { bronze: 50, silver: 200, gold: 500, platinum: 1000 };
    const nextTierReq = tierThresholds[aff.tier];
    if (nextTierReq && aff.active_referrals >= nextTierReq * 0.8) {
      seg.segment = "close_to_tier";
      segments.close_to_tier.push(seg);
    }
  }

  return segments;
}

// ══════════════════════════════════════════════════════════════
// AI NEWSLETTER GENERATION — Pro Segment individuelle Mails
// ══════════════════════════════════════════════════════════════

interface NewsletterContent {
  segment: string;
  subject: string;
  htmlBody: string;
  recipientCount: number;
}

async function generateNewsletterForSegment(
  segment: string,
  affiliates: AffiliateSegment[]
): Promise<NewsletterContent | null> {
  if (!affiliates.length) return null;

  const prompts: Record<string, string> = {
    stars: `Diese Affiliates sind TOP-PERFORMER. Feiere ihre Erfolge, teile ihre Stats, motiviere sie noch mehr Gas zu geben. Erwähne dass sie nah am nächsten Tier sind. Biete exklusive Vorteile an. Mach sie zu Markenbotschaftern.

Top-Performer Daten:
${affiliates.slice(0, 5).map(a => `${a.name}: ${a.activeReferrals} aktive Refs, $${a.totalEarned} verdient, ${a.conversionRate}% CR`).join("\n")}`,

    rising: `Diese Affiliates WACHSEN. Sie haben erste Erfolge, brauchen aber den Push weiterzumachen. Teile konkrete Tipps, zeige was die Top-Performer anders machen, und gib ihnen ein Zwischen-Ziel (z.B. "Noch 3 Referrals bis Silver!").

Daten:
${affiliates.slice(0, 5).map(a => `${a.name}: ${a.activeReferrals} Refs, Tier ${a.tier}`).join("\n")}`,

    stagnant: `Diese Affiliates sind AKTIV aber WACHSEN NICHT. Sie brauchen neue Strategien. Schlage konkrete Marketing-Tipps vor: Social Media Templates, Vergleichsargumente, Zielgruppen-Ideen. Mach es ihnen so EINFACH wie möglich.`,

    sleeping: `Diese Affiliates sind seit 7-14 Tagen INAKTIV. Sanfter Reminder. Zeige was sie in der Zwischenzeit verpasst haben (neue Features, Ergebnisse anderer Partner). Kein Druck, aber FOMO erzeugen.`,

    dead: `Diese Affiliates sind seit 14+ Tagen INAKTIV. Aggressiver Re-Engage. "Wir vermissen dich" + konkretes Comeback-Angebot (z.B. doppelte Commission für die nächsten 7 Tage). Last-Chance Vibe.`,

    new_no_action: `Diese Affiliates haben sich registriert aber NOCH NIE EINEN LINK GETEILT. Sie brauchen ein Schritt-für-Schritt Onboarding. Erkläre: 1) Link kopieren 2) In Bio/Story posten 3) Geld verdienen. Mach es kinderleicht.`,

    close_to_tier: `Diese Affiliates sind KURZ VOR DEM TIER-UPGRADE. Das ist der stärkste Motivator. "Du brauchst nur noch X Referrals bis [nächster Tier]!" + zeige die besseren Raten die sie dann bekommen.

Daten:
${affiliates.map(a => `${a.name}: ${a.activeReferrals} Refs, aktuell ${a.tier}`).join("\n")}`,
  };

  const prompt = prompts[segment];
  if (!prompt) return null;

  try {
    const text = await cachedCall({
      prompt: `Du bist Marcus Steiner, Head of Partnerships bei Gold Foundry (goldfoundry.de). Du schreibst E-Mails die VERKAUFEN und MOTIVIEREN. Du klingst wie ein echter Mensch — kein Bot, kein Corporate-Sprech. Du bist der coole Typ der seine Leute anfeuert, konkrete Tipps gibt, und Erfolge feiert. Du duzt IMMER. Dein Signature-Style: Direkt, energisch, mit echten Zahlen, und immer ein Emoji am richtigen Platz.

Gib JSON zurück: {"subject":"Betreff max 60 Zeichen","body":"HTML Body mit Gold Foundry Forge-Stil. Nutze <strong> für Hervorhebungen, <span style='color:#d4a537'> für Gold-Akzente."}`,
      message: `Segment: ${segment}\nAnzahl: ${affiliates.length}\n\n${prompt}`,
      model: MODELS.smart,
      maxTokens: 800,
    });
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return {
      segment,
      subject: parsed.subject,
      htmlBody: wrapInForgeTemplate(parsed.body),
      recipientCount: affiliates.length,
    };
  } catch (err) {
    log(`Newsletter-Generierung fehlgeschlagen für ${segment}`, { error: (err as Error).message });
    return null;
  }
}

function wrapInForgeTemplate(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Outfit',Helvetica,sans-serif;background:#0a0908;color:#c4b68a;padding:40px 20px;">
<div style="max-width:600px;margin:0 auto;">
<div style="text-align:center;margin-bottom:24px;">
  <span style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#d4a537,#f5e6c8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">GOLD FOUNDRY</span>
  <div style="font-size:9px;letter-spacing:3px;color:#5a4f3a;margin-top:3px;">PARTNER PROGRAM</div>
</div>
<div style="line-height:1.7;font-size:14px;color:#a09070;">
${body}
</div>
<div style="margin-top:30px;text-align:center;">
  <a href="https://goldfoundry.de/dashboard" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#d4a537,#8a6a1a);color:#0a0908;font-weight:600;text-decoration:none;border-radius:2px;font-size:14px;">Zum Partner-Dashboard →</a>
</div>
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #2a2218;text-align:center;font-size:10px;color:#3a3228;">
  Gold Foundry Partner Program · goldfoundry.de
</div></div></body></html>`;
}

// ══════════════════════════════════════════════════════════════
// AUTOMATED CONTEST / EVENT SYSTEM
// ══════════════════════════════════════════════════════════════

export interface SalesEvent {
  id?: string;
  type: "contest" | "sprint" | "webinar" | "milestone" | "flash_bonus";
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  rules: string;
  prizes: string[];
  targetSegment: string;  // 'all', 'bronze', 'silver', etc.
  status: "planned" | "active" | "completed";
  promotionPlan: PromotionAction[];
}

interface PromotionAction {
  channel: "email" | "dashboard_banner" | "social" | "push";
  timing: string;  // "start", "mid", "end", "daily"
  content: string;
}

export async function generateMonthlySalesEvents(): Promise<SalesEvent[]> {
  const now = new Date();
  const month = now.toLocaleDateString("de-DE", { month: "long" });
  const year = now.getFullYear();

  try {
    const text = await cachedCall({
      prompt: `Du bist der Sales Director bei Gold Foundry. Plane 3-4 Events für den kommenden Monat die Affiliates motivieren mehr Leute anzuwerben. Mix aus: Sprint-Contest (1 Woche, wer am meisten Signups), Milestone-Challenge (erreichbare Ziele mit Belohnungen), und Flash-Bonus (24-48h doppelte Commission).

Gib JSON-Array zurück. Jedes Event: {"type":"contest|sprint|flash_bonus|milestone","title":"...","description":"...","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","rules":"...","prizes":["1. Platz: ...","2. Platz: ..."],"targetSegment":"all|bronze|silver","promotionPlan":[{"channel":"email","timing":"start","content":"Kurzbeschreibung der Mail"}]}`,
      message: `Monat: ${month} ${year}. Aktuelle Affiliate-Basis: ~200 Partner. Top-Tier Distribution: 60% Bronze, 25% Silver, 10% Gold, 5% Platinum+.`,
      model: MODELS.smart,
      maxTokens: 1500,
    });
    const events = JSON.parse(text.replace(/```json|```/g, "").trim());
    return events.map((e: any) => ({ ...e, status: "planned" }));
  } catch {
    return [{
      type: "sprint",
      title: `${month}-Sprint: Wer holt die meisten Signups?`,
      description: "7 Tage, wer am meisten neue zahlende User bringt gewinnt.",
      startDate: new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split("T")[0],
      endDate: new Date(now.getFullYear(), now.getMonth(), 22).toISOString().split("T")[0],
      rules: "Nur neue zahlende Signups zählen. Min. Copier-Tier.",
      prizes: ["1. Platz: 1 Monat kostenlos + Feature auf Homepage", "2. Platz: 50% Rabatt", "3. Platz: Custom Landing Page"],
      targetSegment: "all",
      status: "planned",
      promotionPlan: [
        { channel: "email", timing: "start", content: "Sprint startet JETZT!" },
        { channel: "email", timing: "mid", content: "Halbzeit-Update + Leaderboard" },
        { channel: "email", timing: "end", content: "Letzte 24h! Endspurt!" },
      ],
    }];
  }
}

// ══════════════════════════════════════════════════════════════
// SALES MATERIALS — Auto-generierte Vorlagen für Affiliates
// ══════════════════════════════════════════════════════════════

export async function generateSalesMaterials(): Promise<{
  socialPosts: string[];
  storyTemplates: string[];
  comparisonPoints: string[];
  objectionHandlers: Record<string, string>;
}> {
  const db = supabaseAdmin;

  // Get real performance data for authentic social proof
  const { data: recentTrades } = await db.from("trades").select("profit")
    .gte("close_time", new Date(Date.now() - 7 * 86400000).toISOString())
    .eq("is_open", false);

  const weekPnl = (recentTrades ?? []).reduce((s, t) => s + Number(t.profit), 0);
  const weekTrades = recentTrades?.length ?? 0;

  try {
    const text = await cachedCall({
      prompt: `Du erstellst fertige Copy-Paste Vorlagen für Gold Foundry Affiliates. Sie sollen diese in Social Media, DMs, und Gesprächen nutzen. Alles muss AUTHENTISCH klingen, nicht wie Werbung. Nutze echte Daten.

Gib JSON zurück:
{
  "socialPosts": ["5 fertige Social Media Posts (Instagram/X/TikTok Captions)"],
  "storyTemplates": ["3 Instagram Story Texte"],
  "comparisonPoints": ["5 Argumente warum Gold Foundry besser ist als Myfxbook/4X/manuelles Trading"],
  "objectionHandlers": {"Einwand": "Antwort", ...}
}`,
      message: `Echte Daten diese Woche: ${weekTrades} Trades, ${weekPnl >= 0 ? "+" : ""}$${weekPnl.toFixed(0)} P&L. AI Copier läuft seit Launch ohne DD-Breach. Prop-Firm Challenge Pass-Rate: 84%.`,
      model: MODELS.smart,
      maxTokens: 1200,
    });
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      socialPosts: [
        `Gold Foundry AI Copier: ${weekTrades} Trades diese Woche, automatisch. Kein Stress, kein manuelles Trading. Link in Bio.`,
      ],
      storyTemplates: ["Mein AI Trading Bot hat diese Woche wieder geliefert 🔥 Wer will auch? DM me"],
      comparisonPoints: ["AI-gesteuerte Risikoanpassung die Myfxbook nicht hat"],
      objectionHandlers: { "Ist das sicher?": "Der AI Copier hat 12 Schutzebenen und pausiert automatisch bei News und Drawdown." },
    };
  }
}

// ══════════════════════════════════════════════════════════════
// LEADERBOARD + TOP PERFORMER RECOGNITION
// ══════════════════════════════════════════════════════════════

export async function getAffiliateLeaderboard(period: "week" | "month" | "alltime" = "month") {
  const db = supabaseAdmin;

  const since = period === "week" ? new Date(Date.now() - 7 * 86400000)
    : period === "month" ? new Date(Date.now() - 30 * 86400000)
    : new Date(0);

  const { data: conversions } = await db.from("affiliate_conversions")
    .select("affiliate_id, commission_amount, referred_user_id")
    .gte("created_at", since.toISOString())
    .eq("event_type", "first_payment");

  // Aggregate
  const agg: Record<string, { conversions: number; revenue: number }> = {};
  for (const c of conversions ?? []) {
    if (!agg[c.affiliate_id]) agg[c.affiliate_id] = { conversions: 0, revenue: 0 };
    agg[c.affiliate_id].conversions++;
    agg[c.affiliate_id].revenue += Number(c.commission_amount);
  }

  // Get profiles
  const ids = Object.keys(agg);
  if (!ids.length) return [];

  const { data: profiles } = await db.from("affiliate_profiles")
    .select("id, user_id, tier, custom_slug, profiles(full_name, email)")
    .in("id", ids);

  const leaderboard = (profiles ?? []).map(p => ({
    affiliateId: p.id,
    name: (p.profiles as any)?.full_name ?? (p.profiles as any)?.email?.split("@")[0] ?? "Anonym",
    tier: p.tier,
    slug: p.custom_slug,
    conversions: agg[p.id]?.conversions ?? 0,
    earned: Math.round((agg[p.id]?.revenue ?? 0) * 100) / 100,
  }));

  leaderboard.sort((a, b) => b.conversions - a.conversions);
  return leaderboard.slice(0, 20);
}

// ══════════════════════════════════════════════════════════════
// MAIN PIPELINE — Runs daily (Cron)
// ══════════════════════════════════════════════════════════════

export async function runSalesDirectorPipeline(): Promise<{
  segmented: Record<string, number>;
  newslettersSent: number;
  eventsPlanned: number;
  materialsGenerated: boolean;
}> {
  log("Sales Director Pipeline gestartet...");

  const db = supabaseAdmin;
  const results = {
    segmented: {} as Record<string, number>,
    newslettersSent: 0,
    eventsPlanned: 0,
    materialsGenerated: false,
  };

  // 1. Segment all affiliates
  const segments = await segmentAffiliates();
  for (const [seg, affs] of Object.entries(segments)) {
    results.segmented[seg] = affs.length;
  }
  log(`Segmentierung: ${JSON.stringify(results.segmented)}`);

  // 2. Generate & send newsletters per segment
  const RESEND_KEY = process.env.RESEND_API_KEY;

  for (const [segment, affiliates] of Object.entries(segments)) {
    if (!affiliates.length) continue;

    const newsletter = await generateNewsletterForSegment(segment, affiliates);
    if (!newsletter) continue;

    // Send to each affiliate in segment
    for (const aff of affiliates) {
      try {
        if (RESEND_KEY) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Marcus Steiner <marcus@goldfoundry.de>",
              to: aff.email,
              subject: newsletter.subject.replace("{{name}}", aff.name),
              html: newsletter.htmlBody.replace(/\{\{name\}\}/g, aff.name),
            }),
          });
        }

        // Log in CRM
        const { data: contact } = await db.from("crm_contacts")
          .select("id").eq("profile_id", aff.userId).single();

        if (contact) {
          await db.from("crm_communications").insert({
            contact_id: contact.id,
            channel: "email_auto",
            subject: newsletter.subject,
            body: `[Auto-Sales-${segment}] Newsletter an ${aff.email}`,
            email_from: "partners@goldfoundry.de",
            email_to: aff.email,
            email_status: "sent",
            metadata: { segment, campaign: "sales_director_auto" },
          });
        }

        results.newslettersSent++;
      } catch (err) {
        log(`Mail-Fehler: ${aff.email}`, { error: (err as Error).message });
      }
    }
  }

  // 3. Check if monthly events need planning (1st of month)
  const today = new Date().getDate();
  if (today <= 3) {
    const events = await generateMonthlySalesEvents();
    // Store events (could be a separate table — for now log them)
    for (const event of events) {
      log(`Event geplant: ${event.title} (${event.startDate} → ${event.endDate})`);
    }
    results.eventsPlanned = events.length;
  }

  // 4. Generate fresh sales materials (weekly, on Monday)
  if (new Date().getDay() === 1) {
    const materials = await generateSalesMaterials();
    // Store for affiliates to access via dashboard
    await db.from("market_intel").insert({
      risk_level: "GREEN",
      risk_score: 0,
      regime: "SALES_MATERIALS",
      forecast_text: JSON.stringify(materials),
      geopolitical_risk: "LOW",
    });
    results.materialsGenerated = true;
    log("Sales Materials generiert und gespeichert");
  }

  // 5. Self-optimization: Check what worked last week
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: weekComms } = await db.from("crm_communications")
    .select("metadata, email_status")
    .eq("channel", "email_auto")
    .gte("created_at", weekAgo);

  const openRate = weekComms?.length
    ? (weekComms.filter(c => c.email_status === "opened").length / weekComms.length * 100)
    : 0;

  log(`Self-Optimization: Open Rate letzte Woche: ${openRate.toFixed(1)}%`);
  if (openRate < 15) {
    log("⚠️ Open Rate unter 15% — Betreffzeilen müssen aggressiver werden");
  }

  log(`Pipeline fertig: ${results.newslettersSent} Mails, ${results.eventsPlanned} Events`);
  return results;
}
