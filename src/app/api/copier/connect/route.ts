export const dynamic = "force-dynamic";
// src/app/api/copier/connect/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { default: MetaApi } = await import("metaapi.cloud-sdk");
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Subscription check: copier requires paid tier
    const db0 = createSupabaseAdmin();
    const { data: userProfile } = await db0.from("profiles")
      .select("subscription_tier, subscription_active")
      .eq("id", user.id).single();

    if (!userProfile?.subscription_active || !["copier", "pro", "provider", "enterprise"].includes(userProfile.subscription_tier)) {
      return NextResponse.json({ error: "Ein aktives Copier-, Pro- oder Provider-Abo ist erforderlich." }, { status: 403 });
    }

    const { firmProfile, brokerServer, mtLogin, mtPassword, platform } = await request.json();

    if (!firmProfile || !brokerServer || !mtLogin || !mtPassword || !platform) {
      return NextResponse.json({ error: "Alle Felder erforderlich" }, { status: 400 });
    }

    if (!["tegas_24x", "tag_12x"].includes(firmProfile)) {
      return NextResponse.json({ error: "Ungültiges Firm-Profil" }, { status: 400 });
    }

    const warnings: string[] = [];

    const api = new MetaApi(process.env.META_API_TOKEN!);

    // Create account in MetaApi
    const account = await api.metatraderAccountApi.createAccount({
      name: `GF-${firmProfile}-${mtLogin}`,
      type: "cloud",
      login: mtLogin,
      password: mtPassword,
      server: brokerServer,
      platform: platform as "mt4" | "mt5",
    } as any);

    await account.deploy();
    await account.waitConnected();

    // Get account info
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    const info = await connection.getAccountInformation();

    // Calculate DD limit
    const ddLimit = firmProfile === "tegas_24x"
      ? info.equity * 0.95    // 5% trailing from current equity
      : info.balance * 0.90;  // 10% fixed from initial balance

    // Save to Supabase
    const db = createSupabaseAdmin();
    const { data: savedAccount, error: dbError } = await db
      .from("slave_accounts")
      .insert({
        user_id: user.id,
        metaapi_account_id: account.id,
        firm_profile: firmProfile,
        broker_server: brokerServer,
        mt_login: mtLogin,
        platform,
        initial_balance: info.balance,
        current_equity: info.equity,
        equity_high: info.equity,
        dd_limit: ddLimit,
        dd_type: firmProfile === "tegas_24x" ? "trailing" : "fixed",
        phase: firmProfile === "tag_12x" ? 1 : null,
        copier_active: true,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Auto-create Profit Sharing Agreement
    try {
      const { data: masterAccount } = await db.from("master_accounts")
        .select("id, strategy_type").eq("active", true).limit(1).single();

      if (masterAccount) {
        // Find trader who owns the master account (admin for now)
        const { data: adminUser } = await db.from("profiles")
          .select("id").eq("role", "admin").limit(1).single();

        if (adminUser) {
          const { createProfitAgreement } = await import("@/lib/profit/profit-engine");
          await createProfitAgreement(
            savedAccount.id,
            masterAccount.id,
            adminUser.id,       // Trader = Admin (eure Bots)
            user.id,            // Follower = der neue User
            info.equity         // HWM = aktuelle Equity
          );
        }

        // Link master to slave account
        await db.from("slave_accounts")
          .update({ master_account_id: masterAccount.id })
          .eq("id", savedAccount.id);
      }
    } catch (psErr) {
      console.error("[PROFIT-SHARING] Auto-create failed:", (psErr as Error).message);
      warnings.push("Profit-Sharing konnte nicht automatisch eingerichtet werden. Bitte kontaktiere den Support.");
    }

    return NextResponse.json({
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      account: {
        id: savedAccount.id,
        name: info.name,
        login: info.login,
        server: info.server,
        balance: info.balance,
        equity: info.equity,
        currency: info.currency,
        leverage: info.leverage,
        firmProfile,
        ddLimit,
      },
    });
  } catch (err) {
    console.error("[COPIER CONNECT]", err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Connection failed",
    }, { status: 500 });
  }
}
