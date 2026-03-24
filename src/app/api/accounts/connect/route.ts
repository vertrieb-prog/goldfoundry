export const dynamic = "force-dynamic";
// src/app/api/accounts/connect/route.ts — Add MT4/MT5 Tracking Account
// Uses MetaApi REST API directly (SDK crashes in Next.js server: "window is not defined")
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const META_API_BASE = "https://mt-manager-api-v1.agiliumtrade.agiliumtrade.ai";
const META_PROV_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

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

// Poll until account reaches desired state
async function waitForState(accountId: string, token: string, state: string, maxWait = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const acc = await metaApiFetch(`${META_PROV_BASE}/users/current/accounts/${accountId}`, token);
    if (acc.state === state || acc.connectionStatus === "CONNECTED") return acc;
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Timeout: Account verbindet sich nicht. Prüfe Server & Login-Daten.");
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accountName, brokerServer, mtLogin, mtPassword, platform } = await request.json();

    if (!brokerServer || !mtLogin || !mtPassword || !platform) {
      return NextResponse.json({ error: "Broker, Login, Passwort und Plattform erforderlich." }, { status: 400 });
    }

    if (!["mt4", "mt5"].includes(platform)) {
      return NextResponse.json({ error: "Plattform muss mt4 oder mt5 sein." }, { status: 400 });
    }

    const token = process.env.META_API_TOKEN || process.env.METAAPI_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "MetaApi nicht konfiguriert. Kontaktiere den Support." }, { status: 500 });
    }

    // 1. Create account via MetaApi REST API
    const created = await metaApiFetch(`${META_PROV_BASE}/users/current/accounts`, token, {
      method: "POST",
      body: JSON.stringify({
        name: accountName || `GF-Track-${mtLogin}`,
        type: "cloud",
        login: mtLogin,
        password: mtPassword,
        server: brokerServer,
        platform,
        application: "MetaApi",
        magic: 0,
      }),
    });

    const accountId = created.id;

    // 2. Deploy the account
    await metaApiFetch(`${META_PROV_BASE}/users/current/accounts/${accountId}/deploy`, token, { method: "POST" });

    // 3. Wait for connection
    await waitForState(accountId, token, "DEPLOYED");

    // 4. Get account information via RPC
    let info: any;
    try {
      info = await metaApiFetch(
        `${META_API_BASE}/users/current/accounts/${accountId}/account-information`,
        token
      );
    } catch {
      // Retry once after short wait
      await new Promise(r => setTimeout(r, 3000));
      info = await metaApiFetch(
        `${META_API_BASE}/users/current/accounts/${accountId}/account-information`,
        token
      );
    }

    // 5. Save to Supabase as tracking account
    const db = createSupabaseAdmin();
    const { data: saved, error: dbError } = await db
      .from("slave_accounts")
      .insert({
        user_id: user.id,
        metaapi_account_id: accountId,
        account_type: "tracking",
        account_name: accountName || `${brokerServer} #${mtLogin}`,
        firm_profile: "tracking",
        broker_server: brokerServer,
        broker_name: brokerServer.split("-")[0],
        mt_login: mtLogin,
        platform,
        initial_balance: info.balance ?? 0,
        current_equity: info.equity ?? info.balance ?? 0,
        equity_high: info.equity ?? info.balance ?? 0,
        dd_limit: 0,
        dd_type: "fixed",
        currency: info.currency ?? "USD",
        leverage: info.leverage ?? 0,
        copier_active: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[ACCOUNT CONNECT] DB Error:", dbError);
      return NextResponse.json({ error: `Datenbankfehler: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      account: {
        id: saved.id,
        name: saved.account_name,
        login: info.login ?? mtLogin,
        server: info.server ?? brokerServer,
        balance: info.balance ?? 0,
        equity: info.equity ?? info.balance ?? 0,
        currency: info.currency ?? "USD",
        leverage: info.leverage ?? 0,
        platform,
      },
    });
  } catch (err) {
    console.error("[ACCOUNT CONNECT]", err);
    const message = err instanceof Error ? err.message : "Connection failed";

    // User-friendly error messages
    if (message.includes("E_SRV_NOT_FOUND") || message.includes("server not found")) {
      return NextResponse.json({ error: "Broker-Server nicht gefunden. Überprüfe den Servernamen." }, { status: 400 });
    }
    if (message.includes("E_AUTH") || message.includes("Invalid credentials") || message.includes("password") || message.includes("Authorization")) {
      return NextResponse.json({ error: "Login oder Passwort falsch. Nutze das Investor-Passwort (Read-Only)." }, { status: 400 });
    }
    if (message.includes("Timeout") || message.includes("timeout")) {
      return NextResponse.json({ error: "Verbindung dauert zu lange. Prüfe Server & Login-Daten." }, { status: 504 });
    }
    if (message.includes("already exists") || message.includes("duplicate")) {
      return NextResponse.json({ error: "Dieses Konto ist bereits verbunden." }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
