export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Fetch all active leads
    const { data: leads, error } = await supabaseAdmin
      .from("crm_leads")
      .select("*")
      .in("status", ["visitor", "registered", "trial", "active"]);

    if (error) throw error;
    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: true, scored: 0 });
    }

    let scored = 0;
    for (const lead of leads) {
      // Fetch recent activities for this lead
      const { data: activities } = await supabaseAdmin
        .from("crm_activities")
        .select("type, created_at")
        .eq("lead_id", lead.id)
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
        .order("created_at", { ascending: false });

      let score = 0;

      // Status-based scoring
      if (lead.status === "active") score += 30;
      else if (lead.status === "trial") score += 20;
      else if (lead.status === "registered") score += 10;

      // Activity-based scoring
      if (activities) {
        for (const a of activities) {
          if (a.type === "payment") score += 20;
          else if (a.type === "trade") score += 5;
          else if (a.type === "login") score += 3;
          else if (a.type === "page_view") score += 1;
          else if (a.type === "copier_start") score += 15;
          else if (a.type === "mentor_chat") score += 5;
        }
      }

      // Recency bonus
      const daysSinceLastSeen = (Date.now() - new Date(lead.last_seen).getTime()) / 86400000;
      if (daysSinceLastSeen < 1) score += 10;
      else if (daysSinceLastSeen < 7) score += 5;

      // Churn risk (inverse of engagement)
      const churnRisk = daysSinceLastSeen > 30 ? 90 : daysSinceLastSeen > 14 ? 60 : daysSinceLastSeen > 7 ? 30 : 10;

      score = Math.min(100, Math.max(0, score));

      await supabaseAdmin
        .from("crm_leads")
        .update({ score, churn_risk: churnRisk })
        .eq("id", lead.id);

      scored++;
    }

    return NextResponse.json({ success: true, scored });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
