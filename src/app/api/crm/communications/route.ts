export const dynamic = "force-dynamic";
// src/app/api/crm/communications/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { logCommunication, getContactCommunications, sendCRMEmail } from "@/lib/crm/crm-engine";
import { NextResponse } from "next/server";

// GET — Communication history for a contact
export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contact_id");
  if (!contactId) return NextResponse.json({ error: "contact_id required" }, { status: 400 });

  const comms = await getContactCommunications(contactId, 100);
  return NextResponse.json({ communications: comms });
}

// POST — Log a communication or send an email
export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "trader"].includes(profile.role)) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // If action is "send_email" → actually send the email
    if (body.action === "send_email") {
      const result = await sendCRMEmail(
        body.contactId,
        body.subject,
        body.htmlBody,
        user.id
      );
      return NextResponse.json({ success: true, ...result });
    }

    // Otherwise just log the communication
    const comm = await logCommunication({
      contactId: body.contactId,
      channel: body.channel,
      subject: body.subject,
      body: body.body,
      isInternal: body.isInternal ?? false,
      createdBy: user.id,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, communication: comm });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
