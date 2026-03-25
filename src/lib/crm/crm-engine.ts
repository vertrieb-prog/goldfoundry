// src/lib/crm/crm-engine.ts
// ============================================================
// GOLD FOUNDRY CRM — Contact, Communication & Activity Engine
// ============================================================

import { createSupabaseAdmin } from "@/lib/supabase/server";

// ── Contact Management ────────────────────────────────────────

export async function createContact(data: {
  email: string;
  fullName?: string;
  phone?: string;
  country?: string;
  source: string;
  sourceDetail?: string;
  referredByContactId?: string;
  tags?: string[];
  tradingExperience?: string;
  profileId?: string;
}) {
  const db = createSupabaseAdmin();

  const { data: contact, error } = await db.from("crm_contacts").insert({
    email: data.email,
    full_name: data.fullName,
    phone: data.phone,
    country: data.country,
    source: data.source,
    source_detail: data.sourceDetail,
    referred_by_contact: data.referredByContactId,
    tags: data.tags ?? [],
    trading_experience: data.tradingExperience,
    profile_id: data.profileId,
    last_activity_at: new Date().toISOString(),
  }).select().single();

  if (error) throw error;

  // Log activity
  await logActivity(contact.id, "signup", `Neuer Kontakt: ${data.email} via ${data.source}`);

  return contact;
}

export async function updateContact(contactId: string, updates: Record<string, any>) {
  const db = createSupabaseAdmin();
  updates.updated_at = new Date().toISOString();

  const { data, error } = await db.from("crm_contacts")
    .update(updates).eq("id", contactId).select().single();

  if (error) throw error;
  return data;
}

export async function searchContacts(filters: {
  status?: string;
  tags?: string[];
  source?: string;
  search?: string; // Email oder Name
  hasPropFirm?: boolean;
  assignedTo?: string;
  minScore?: number;
  limit?: number;
  offset?: number;
}) {
  const db = createSupabaseAdmin();
  let query = db.from("crm_contacts").select("*", { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.hasPropFirm !== undefined) query = query.eq("has_prop_firm", filters.hasPropFirm);
  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.minScore) query = query.gte("lead_score", filters.minScore);
  if (filters.tags?.length) query = query.overlaps("tags", filters.tags);
  if (filters.search) {
    query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
  }

  query = query.order("last_activity_at", { ascending: false })
    .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 50) - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return { contacts: data ?? [], total: count ?? 0 };
}

// ── Communication Tracking ────────────────────────────────────

export async function logCommunication(data: {
  contactId: string;
  channel: string;
  subject?: string;
  body: string;
  emailFrom?: string;
  emailTo?: string;
  emailStatus?: string;
  isInternal?: boolean;
  createdBy?: string;
  metadata?: Record<string, any>;
}) {
  const db = createSupabaseAdmin();

  const { data: comm, error } = await db.from("crm_communications").insert({
    contact_id: data.contactId,
    channel: data.channel,
    subject: data.subject,
    body: data.body,
    email_from: data.emailFrom,
    email_to: data.emailTo,
    email_status: data.emailStatus,
    is_internal: data.isInternal ?? false,
    created_by: data.createdBy,
    metadata: data.metadata ?? {},
  }).select().single();

  if (error) throw error;

  // Update last activity
  await db.from("crm_contacts").update({
    last_activity_at: new Date().toISOString(),
  }).eq("id", data.contactId);

  return comm;
}

export async function getContactCommunications(contactId: string, limit = 50) {
  const db = createSupabaseAdmin();

  const { data, error } = await db.from("crm_communications")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// ── Activity Tracking ─────────────────────────────────────────

export async function logActivity(
  contactId: string,
  type: string,
  description: string,
  metadata: Record<string, any> = {}
) {
  const db = createSupabaseAdmin();

  await db.from("crm_activities").insert({
    contact_id: contactId,
    activity_type: type,
    description,
    metadata,
  });

  await db.from("crm_contacts").update({
    last_activity_at: new Date().toISOString(),
  }).eq("id", contactId);
}

export async function getContactActivities(contactId: string, limit = 100) {
  const db = createSupabaseAdmin();

  const { data } = await db.from("crm_activities")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

// ── Auto-Track System Events ──────────────────────────────────
// Wird von anderen Systemen aufgerufen wenn etwas passiert

export async function trackUserEvent(profileId: string, event: string, details: string, meta?: any) {
  const db = createSupabaseAdmin();

  // Find CRM contact by profile_id
  const { data: contact } = await db.from("crm_contacts")
    .select("id").eq("profile_id", profileId).single();

  if (contact) {
    await logActivity(contact.id, event, details, meta ?? {});

    // Auto-update status based on events
    const statusUpdates: Record<string, string> = {
      subscription_start: "active",
      subscription_cancel: "churned",
      copier_connected: "active",
    };
    if (statusUpdates[event]) {
      await updateContact(contact.id, { status: statusUpdates[event] });
    }

    // Auto-update lead score
    const { data: score } = await db.rpc("calculate_lead_score", { contact_id: contact.id });
    if (score !== null) {
      await db.from("crm_contacts").update({ lead_score: score }).eq("id", contact.id);
    }
  }
}

// ── Send Email via CRM ────────────────────────────────────────

export async function sendCRMEmail(
  contactId: string,
  subject: string,
  htmlBody: string,
  createdBy?: string
) {
  const db = createSupabaseAdmin();

  // Get contact email
  const { data: contact } = await db.from("crm_contacts").select("email, full_name").eq("id", contactId).single();
  if (!contact) throw new Error("Contact not found");

  // Send via email engine
  const { sendEmail } = await import("@/lib/email/email-engine");

  // Replace variables in body (HTML-escaped to prevent injection)
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const processedBody = htmlBody
    .replace(/\{\{name\}\}/g, esc(contact.full_name ?? ""))
    .replace(/\{\{email\}\}/g, esc(contact.email));

  // Note: sendEmail is not exported individually in the current email-engine
  // Using fetch to Resend directly here
  const RESEND_KEY = (process.env.RESEND_API_KEY || "").trim();
  let emailStatus = "sent";

  if (RESEND_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Gold Foundry <forge@goldfoundry.de>",
          to: contact.email,
          subject,
          html: processedBody,
        }),
      });
      if (!res.ok) emailStatus = "failed";
    } catch {
      emailStatus = "failed";
    }
  } else {
    emailStatus = "sent"; // Simulated
  }

  // Log in CRM
  await logCommunication({
    contactId,
    channel: "email_outbound",
    subject,
    body: processedBody,
    emailFrom: "forge@goldfoundry.de",
    emailTo: contact.email,
    emailStatus,
    createdBy,
  });

  return { status: emailStatus, to: contact.email };
}

// ── CRM Dashboard Stats ──────────────────────────────────────

export async function getCRMDashboard() {
  const db = createSupabaseAdmin();

  const [
    { count: totalContacts },
    { count: leads },
    { count: active },
    { count: churned },
    { count: trials },
    { data: recentActivities },
    { data: recentComms },
    { data: topReferrers },
  ] = await Promise.all([
    db.from("crm_contacts").select("*", { count: "exact", head: true }),
    db.from("crm_contacts").select("*", { count: "exact", head: true }).eq("status", "lead"),
    db.from("crm_contacts").select("*", { count: "exact", head: true }).eq("status", "active"),
    db.from("crm_contacts").select("*", { count: "exact", head: true }).eq("status", "churned"),
    db.from("crm_contacts").select("*", { count: "exact", head: true }).eq("status", "trial"),
    db.from("crm_activities").select("*").order("created_at", { ascending: false }).limit(20),
    db.from("crm_communications").select("*").not("channel", "eq", "system").order("created_at", { ascending: false }).limit(10),
    db.from("crm_contacts").select("id, full_name, email").not("referred_by_contact", "is", null),
  ]);

  // Count referrals per person
  const referralCounts: Record<string, number> = {};
  for (const c of topReferrers ?? []) {
    // simplified — in production do a proper GROUP BY query
  }

  return {
    stats: {
      total: totalContacts ?? 0,
      leads: leads ?? 0,
      active: active ?? 0,
      churned: churned ?? 0,
      trials: trials ?? 0,
      conversionRate: totalContacts ? ((active ?? 0) / totalContacts * 100).toFixed(1) : "0",
    },
    recentActivities: recentActivities ?? [],
    recentCommunications: recentComms ?? [],
    pipeline: {
      lead: leads ?? 0,
      trial: trials ?? 0,
      active: active ?? 0,
      churned: churned ?? 0,
    },
  };
}
