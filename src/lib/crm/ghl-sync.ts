// src/lib/crm/ghl-sync.ts — GoHighLevel CRM Sync
// Pusht Leads aus dem Gold Foundry Funnel ins GHL CRM

const GHL_API_KEY = process.env.GHL_API_KEY || "";
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "";
const GHL_BASE = "https://services.leadconnectorhq.com";

interface GHLContact {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  tags?: string[];
  source?: string;
  customField?: Record<string, string>;
}

export async function pushLeadToGHL(contact: GHLContact): Promise<{ success: boolean; contactId?: string; error?: string }> {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.log("[GHL] API Key or Location ID not set, skipping sync");
    return { success: false, error: "GHL not configured" };
  }

  try {
    // Check if contact exists
    const searchRes = await fetch(
      `${GHL_BASE}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(contact.email)}`,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-07-28",
        },
      }
    );

    const searchData = await searchRes.json();

    if (searchData.contact?.id) {
      // Update existing contact
      const updateRes = await fetch(`${GHL_BASE}/contacts/${searchData.contact.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json",
          Version: "2021-07-28",
        },
        body: JSON.stringify({
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone,
          tags: contact.tags,
          source: contact.source || "Gold Foundry Funnel",
        }),
      });

      console.log("[GHL] Updated contact:", searchData.contact.id);
      return { success: true, contactId: searchData.contact.id };
    }

    // Create new contact
    const createRes = await fetch(`${GHL_BASE}/contacts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email,
        phone: contact.phone || "",
        tags: contact.tags || ["gold-foundry", "funnel-lead"],
        source: contact.source || "Gold Foundry Funnel",
      }),
    });

    const createData = await createRes.json();

    if (createData.contact?.id) {
      console.log("[GHL] Created contact:", createData.contact.id);
      return { success: true, contactId: createData.contact.id };
    }

    console.error("[GHL] Create failed:", createData);
    return { success: false, error: createData.message || "GHL create failed" };
  } catch (err: any) {
    console.error("[GHL] Sync error:", err.message);
    return { success: false, error: err.message };
  }
}

export async function addTagToContact(contactId: string, tags: string[]): Promise<void> {
  if (!GHL_API_KEY) return;

  try {
    await fetch(`${GHL_BASE}/contacts/${contactId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({ tags }),
    });
  } catch (err: any) {
    console.error("[GHL] Tag error:", err.message);
  }
}
