// ═══════════════════════════════════════════════════════════════
// src/lib/partner/hot-leads.ts — Hot Lead Tracking
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function trackVisitor(partnerId: string, visitorHash: string, page: string) {
    const { data: existing } = await supabaseAdmin
        .from("hot_leads")
        .select("*")
        .eq("partner_id", partnerId)
        .eq("visitor_hash", visitorHash)
        .single();

    if (existing) {
        const pages = new Set([...(existing.pages_viewed || []), page]);
        await supabaseAdmin.from("hot_leads").update({
            visit_count: (existing.visit_count || 0) + 1,
            pages_viewed: [...pages],
            last_visit: new Date().toISOString(),
        }).eq("id", existing.id);
    } else {
        await supabaseAdmin.from("hot_leads").insert({
            partner_id: partnerId,
            visitor_hash: visitorHash,
            visit_count: 1,
            pages_viewed: [page],
            converted: false,
            last_visit: new Date().toISOString(),
        });
    }
}

export async function getHotLeads(partnerId: string) {
    const { data } = await supabaseAdmin
        .from("hot_leads")
        .select("*")
        .eq("partner_id", partnerId)
        .eq("converted", false)
        .gte("visit_count", 2)
        .order("visit_count", { ascending: false })
        .limit(20);
    return data || [];
}
