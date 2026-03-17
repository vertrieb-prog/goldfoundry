export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Find churned or inactive leads that haven't been contacted recently
    const { data: leads, error } = await supabaseAdmin
      .from("crm_leads")
      .select("*")
      .in("status", ["churned", "paused"])
      .gte("last_seen", new Date(Date.now() - 90 * 86400000).toISOString()) // Not older than 90 days
      .order("lifetime_value", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: true, queued: 0 });
    }

    // Find active winback campaign
    const { data: campaign } = await supabaseAdmin
      .from("crm_campaigns")
      .select("*")
      .eq("type", "winback")
      .eq("active", true)
      .limit(1)
      .single();

    if (!campaign) {
      return NextResponse.json({ success: true, queued: 0, message: "No active winback campaign" });
    }

    let queued = 0;

    for (const lead of leads) {
      if (!lead.email) continue;

      // Check if we already sent a winback email recently
      const { data: recentEmail } = await supabaseAdmin
        .from("crm_email_queue")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("campaign_id", campaign.id)
        .gte("scheduled_at", new Date(Date.now() - 14 * 86400000).toISOString())
        .limit(1);

      if (recentEmail && recentEmail.length > 0) continue;

      // Personalize subject and body
      const subject = (campaign.subject_template || "Wir vermissen dich!")
        .replace("{{name}}", lead.name || "Trader");
      const body = (campaign.body_template || "Komm zurück zu Gold Foundry.")
        .replace("{{name}}", lead.name || "Trader")
        .replace("{{plan}}", lead.plan || "Starter");

      await supabaseAdmin.from("crm_email_queue").insert({
        user_id: lead.user_id,
        lead_id: lead.id,
        campaign_id: campaign.id,
        email: lead.email,
        subject,
        body,
        status: "pending",
        scheduled_at: new Date().toISOString(),
      });

      queued++;
    }

    // Update campaign stats
    if (queued > 0) {
      await supabaseAdmin
        .from("crm_campaigns")
        .update({ sent_count: (campaign.sent_count || 0) + queued })
        .eq("id", campaign.id);
    }

    return NextResponse.json({ success: true, queued });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
