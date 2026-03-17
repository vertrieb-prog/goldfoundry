export const dynamic = "force-dynamic";
// src/app/api/cryptomus/checkout/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { createCryptomusInvoice } from "@/lib/payments/cryptomus-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, currency } = await request.json();
  if (!["analyzer", "copier", "pro", "provider"].includes(plan)) {
    return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 });
  }

  try {
    const result = await createCryptomusInvoice({ userId: user.id, email: user.email ?? "", plan, currency });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
