// src/app/api/crm/campaigns/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { searchContacts, logCommunication } from "@/lib/crm/crm-engine";
import { NextResponse } from "next/server";

// GET — List all campaigns
export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { data } = await db.from("crm_campaigns").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ campaigns: data ?? [] });
}

// POST — Create or send campaign
export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const db = createSupabaseAdmin();
  const body = await request.json();

  if (body.action === "create") {
    const { data: campaign } = await db.from("crm_campaigns").insert({
      name: body.name,
      template_id: body.templateId,
      target_filter: body.targetFilter ?? {},
      status: "draft",
      created_by: user.id,
    }).select().single();

    return NextResponse.json({ success: true, campaign });
  }

  if (body.action === "send") {
    const campaignId = body.campaignId;
    const { data: campaign } = await db.from("crm_campaigns").select("*").eq("id", campaignId).single();
    if (!campaign) return NextResponse.json({ error: "Campaign nicht gefunden" }, { status: 404 });

    // Get template
    const { data: template } = await db.from("crm_email_templates").select("*").eq("id", campaign.template_id).single();
    if (!template) return NextResponse.json({ error: "Template nicht gefunden" }, { status: 404 });

    // Get filtered contacts
    const filter = campaign.target_filter ?? {};
    const { contacts } = await searchContacts({
      status: filter.status,
      tags: filter.tags,
      source: filter.source,
      limit: 10000,
    });

    // Send to each contact
    let sent = 0, failed = 0;
    const RESEND_KEY = process.env.RESEND_API_KEY;

    for (const contact of contacts) {
      const personalizedSubject = template.subject.replace(/\{\{name\}\}/g, contact.full_name ?? "");
      const personalizedBody = template.body_html
        .replace(/\{\{name\}\}/g, contact.full_name ?? "")
        .replace(/\{\{email\}\}/g, contact.email);

      let emailStatus = "sent";
      if (RESEND_KEY) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Gold Foundry <forge@goldfoundry.de>",
              to: contact.email,
              subject: personalizedSubject,
              html: personalizedBody,
            }),
          });
          emailStatus = res.ok ? "sent" : "failed";
        } catch { emailStatus = "failed"; }
      }

      await logCommunication({
        contactId: contact.id,
        channel: "email_auto",
        subject: personalizedSubject,
        body: personalizedBody,
        emailFrom: "forge@goldfoundry.de",
        emailTo: contact.email,
        emailStatus,
        metadata: { campaignId },
      });

      emailStatus === "sent" ? sent++ : failed++;
    }

    // Update campaign stats
    await db.from("crm_campaigns").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      stats: { sent, failed, delivered: sent, opened: 0, clicked: 0, bounced: failed },
    }).eq("id", campaignId);

    return NextResponse.json({ success: true, sent, failed, total: contacts.length });
  }

  return NextResponse.json({ error: "action muss 'create' oder 'send' sein" }, { status: 400 });
}
