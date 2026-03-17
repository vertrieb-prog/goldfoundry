// src/app/api/crm/activities/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { getContactActivities } from "@/lib/crm/crm-engine";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contact_id");
  if (!contactId) return NextResponse.json({ error: "contact_id required" }, { status: 400 });

  const activities = await getContactActivities(contactId);
  return NextResponse.json({ activities });
}
