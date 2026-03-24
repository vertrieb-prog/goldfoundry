export const dynamic = "force-dynamic";
// src/app/api/accounts/create-demo/route.ts — Create MetaApi Demo Account (One-Click)
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const META_PROV_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";
const META_API_BASE = "https://mt-manager-api-v1.agiliumtrade.agiliumtrade.ai";

async function metaApiFetch(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "auth-token": token,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    let msg = `MetaApi Error ${res.status}`;
    try { const j = JSON.parse(body); msg = j.message ?? j.error ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function waitForState(accountId: string, token: string, maxWait = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const acc = await metaApiFetch(`${META_PROV_BASE}/users/current/accounts/${accountId}`, token);
    if (acc.state === "DEPLOYED" || acc.connectionStatus === "CONNECTED") return acc;
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Timeout: Demo-Konto verbindet sich nicht.");
}

// Demo broker servers that support demo accounts
const DEMO_SERVERS = [
  { server: "ICMarketsSC-Demo", platform: "mt5", name: "ICMarkets Demo" },
  { server: "MetaQuotes-Demo", platform: "mt5", name: "MetaQuotes Demo" },
  { server: "Pepperstone-Demo", platform: "mt5", name: "Pepperstone Demo" },
];

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const token = process.env.META_API_TOKEN || process.env.METAAPI_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "MetaApi nicht konfiguriert. Kontaktiere den Support." }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const preferredPlatform = body.platform || "mt5";

    // Check if user already has a demo account
    const db = createSupabaseAdmin();
    const { data: existing } = await db
      .from("slave_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("account_type", "demo")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Du hast bereits ein Demo-Konto. Gehe zum Dashboard um es zu sehen." }, { status: 409 });
    }

    // 1. Create a demo account via MetaApi provisioning
    const demoName = `GF-Demo-${user.id.slice(0, 8)}`;
    const created = await metaApiFetch(`${META_PROV_BASE}/users/current/accounts`, token, {
      method: "POST",
      body: JSON.stringify({
        name: demoName,
        type: "cloud",
        platform: preferredPlatform,
        application: "MetaApi",
        magic: 0,
        // MetaApi demo account - uses their built-in demo provisioning
        provisioningProfileId: undefined,
        // Try to create via demo server
        server: DEMO_SERVERS[0].server,
        login: "0", // MetaApi creates auto login for demos
        password: "demo_" + Date.now(),
      }),
    });

    const accountId = created.id;

    // 2. Deploy
    await metaApiFetch(`${META_PROV_BASE}/users/current/accounts/${accountId}/deploy`, token, { method: "POST" });

    // 3. Wait for deployment
    await waitForState(accountId, token);

    // 4. Get account info
    let info: any = { balance: 10000, equity: 10000, currency: "USD", leverage: 100 };
    try {
      info = await metaApiFetch(
        `${META_API_BASE}/users/current/accounts/${accountId}/account-information`,
        token
      );
    } catch {
      // Use defaults if account info not available yet
      await new Promise(r => setTimeout(r, 3000));
      try {
        info = await metaApiFetch(
          `${META_API_BASE}/users/current/accounts/${accountId}/account-information`,
          token
        );
      } catch {}
    }

    // 5. Save to DB
    const { data: saved, error: dbError } = await db
      .from("slave_accounts")
      .insert({
        user_id: user.id,
        metaapi_account_id: accountId,
        account_type: "demo",
        account_name: "Demo-Konto (MetaApi)",
        firm_profile: "tracking",
        broker_server: DEMO_SERVERS[0].server,
        broker_name: "Demo",
        mt_login: info.login ?? "demo",
        platform: preferredPlatform,
        initial_balance: info.balance ?? 10000,
        current_equity: info.equity ?? info.balance ?? 10000,
        equity_high: info.equity ?? info.balance ?? 10000,
        dd_limit: 0,
        dd_type: "fixed",
        currency: info.currency ?? "USD",
        leverage: info.leverage ?? 100,
        copier_active: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[DEMO CREATE] DB Error:", dbError);
      return NextResponse.json({ error: `Datenbankfehler: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      account: {
        id: saved.id,
        name: "Demo-Konto",
        login: info.login ?? "demo",
        server: DEMO_SERVERS[0].server,
        balance: info.balance ?? 10000,
        equity: info.equity ?? 10000,
        currency: info.currency ?? "USD",
        leverage: info.leverage ?? 100,
        platform: preferredPlatform,
      },
    });
  } catch (err) {
    console.error("[DEMO CREATE]", err);
    const message = err instanceof Error ? err.message : "Demo-Erstellung fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
