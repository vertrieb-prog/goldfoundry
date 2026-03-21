// src/lib/crm/ghl-sync.ts — GoHighLevel CRM Sync + Email
// Leads synchen, Emails senden, Workflows triggern — alles über GHL

const GHL_API_KEY = process.env.GHL_API_KEY || "";
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "";
const GHL_BASE = "https://services.leadconnectorhq.com";

const headers = () => ({
  Authorization: `Bearer ${GHL_API_KEY}`,
  "Content-Type": "application/json",
  Version: "2021-07-28",
});

interface GHLContact {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  tags?: string[];
  source?: string;
}

// ── Push Lead to GHL ─────────────────────────────────────────
export async function pushLeadToGHL(contact: GHLContact): Promise<{ success: boolean; contactId?: string; error?: string }> {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.log("[GHL] Not configured, skipping");
    return { success: false, error: "GHL not configured" };
  }

  try {
    // Check if contact exists
    const searchRes = await fetch(
      `${GHL_BASE}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(contact.email)}`,
      { headers: headers() }
    );
    const searchData = await searchRes.json();

    if (searchData.contact?.id) {
      // Update existing
      await fetch(`${GHL_BASE}/contacts/${searchData.contact.id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone,
          tags: contact.tags,
          source: contact.source || "Gold Foundry",
        }),
      });
      console.log("[GHL] Updated:", searchData.contact.id);
      return { success: true, contactId: searchData.contact.id };
    }

    // Create new
    const createRes = await fetch(`${GHL_BASE}/contacts/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email,
        phone: contact.phone || "",
        tags: contact.tags || ["gold-foundry"],
        source: contact.source || "Gold Foundry",
      }),
    });
    const createData = await createRes.json();

    if (createData.contact?.id) {
      console.log("[GHL] Created:", createData.contact.id);
      return { success: true, contactId: createData.contact.id };
    }

    return { success: false, error: createData.message || "Create failed" };
  } catch (err: any) {
    console.error("[GHL] Sync error:", err.message);
    return { success: false, error: err.message };
  }
}

// ── Add Tags ─────────────────────────────────────────────────
export async function addTagToContact(contactId: string, tags: string[]): Promise<void> {
  if (!GHL_API_KEY) return;
  try {
    await fetch(`${GHL_BASE}/contacts/${contactId}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ tags }),
    });
  } catch (err: any) {
    console.error("[GHL] Tag error:", err.message);
  }
}

// ── Send Email via GHL ───────────────────────────────────────
export async function sendEmailViaGHL(
  contactId: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  if (!GHL_API_KEY) return { success: false, error: "GHL not configured" };

  try {
    const res = await fetch(`${GHL_BASE}/conversations/messages`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        type: "Email",
        contactId,
        subject,
        html: htmlBody,
        emailFrom: "Gold Foundry <forge@goldfoundry.de>",
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log("[GHL] Email sent to contact:", contactId);
      return { success: true };
    }

    console.error("[GHL] Email error:", data);
    return { success: false, error: data.message || "Email failed" };
  } catch (err: any) {
    console.error("[GHL] Email error:", err.message);
    return { success: false, error: err.message };
  }
}

// ── Push Lead + Send Email in one call ───────────────────────
export async function pushLeadAndEmail(
  contact: GHLContact,
  emailSubject: string,
  emailHtml: string
): Promise<{ success: boolean; contactId?: string }> {
  const result = await pushLeadToGHL(contact);

  if (result.contactId) {
    await sendEmailViaGHL(result.contactId, emailSubject, emailHtml);
  }

  return result;
}

// ── Add Note to Contact ──────────────────────────────────────
export async function addNoteToContact(contactId: string, note: string): Promise<void> {
  if (!GHL_API_KEY) return;
  try {
    await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ body: note }),
    });
  } catch (err: any) {
    console.error("[GHL] Note error:", err.message);
  }
}
