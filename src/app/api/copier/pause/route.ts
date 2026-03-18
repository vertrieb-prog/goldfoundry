export const dynamic = "force-dynamic";
// src/app/api/copier/pause/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId, action, reason } = await request.json();
  // action: 'pause' | 'resume'

  const db = createSupabaseAdmin();

  // Verify ownership
  const { data: account } = await db.from("slave_accounts").select("*").eq("id", accountId).eq("user_id", user.id).single();
  if (!account) return NextResponse.json({ error: "Account nicht gefunden" }, { status: 404 });

  if (action === "pause") {
    await db.from("slave_accounts").update({
      copier_active: false,
      copier_paused_reason: reason ?? "Manuell pausiert",
    }).eq("id", accountId);

    // Deactivate profit-sharing agreement for this account
    await db.from("profit_sharing").update({ active: false })
      .eq("follower_account_id", accountId);

    return NextResponse.json({ success: true, status: "paused" });
  }

  if (action === "resume") {
    const ddBuffer = Number(account.current_equity) > 0
      ? ((Number(account.current_equity) - Number(account.dd_limit)) / Number(account.current_equity)) * 100 : 0;

    if (ddBuffer < 5) {
      return NextResponse.json({
        error: `DD-Buffer bei ${ddBuffer.toFixed(1)}%. Kann nicht fortgesetzt werden bis Buffer > 15%.`,
      }, { status: 400 });
    }

    await db.from("slave_accounts").update({
      copier_active: true,
      copier_paused_reason: null,
    }).eq("id", accountId);

    // Reactivate profit-sharing agreement for this account
    await db.from("profit_sharing").update({ active: true })
      .eq("follower_account_id", accountId);

    return NextResponse.json({ success: true, status: "resumed" });
  }

  return NextResponse.json({ error: "action muss 'pause' oder 'resume' sein" }, { status: 400 });
}
