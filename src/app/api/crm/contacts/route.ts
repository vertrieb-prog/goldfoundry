export const dynamic = "force-dynamic";
// src/app/api/crm/contacts/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { createContact, searchContacts, updateContact } from "@/lib/crm/crm-engine";
import { NextResponse } from "next/server";

// GET — Search/List contacts
export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check admin or trader role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "trader"].includes(profile.role)) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const results = await searchContacts({
    status: searchParams.get("status") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    search: searchParams.get("q") ?? undefined,
    tags: searchParams.get("tags")?.split(",") ?? undefined,
    hasPropFirm: searchParams.get("prop_firm") === "true" ? true : undefined,
    minScore: searchParams.get("min_score") ? parseInt(searchParams.get("min_score")!) : undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
    offset: parseInt(searchParams.get("offset") ?? "0"),
  });

  return NextResponse.json(results);
}

// POST — Create new contact
export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const body = await request.json();
    const contact = await createContact(body);
    return NextResponse.json({ success: true, contact });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PATCH — Update contact
export async function PATCH(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const { contactId, ...updates } = await request.json();
    const contact = await updateContact(contactId, updates);
    return NextResponse.json({ success: true, contact });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
