export const dynamic = "force-dynamic";
export const maxDuration = 60;
// src/app/api/accounts/create-demo/route.ts — Create MetaApi Demo Account (One-Click)
// Uses MetaApi's provisioning-profiles demo account generation endpoint
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const META_PROV_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";
const META_CLIENT_BASE = "https://mt-client-api-v1.new-york.agiliumtrade.ai";

async function metaApiFetch(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "auth-token": token,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const body = await res.text();
    let msg = `MetaApi Error ${res.status}`;
    try { const j = JSON.parse(body); msg = j.message ?? j.error ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Servers that support MetaApi demo generation (in order of preference)
const DEMO_CONFIGS = [
  { server: "ICMarketsSC-Demo", platform: "mt5", endpoint: "mt5-demo-accounts" },
  { server: "MetaQuotes-Demo", platform: "mt5", endpoint: "mt5-demo-accounts" },
  { server: "Pepperstone-Demo", platform: "mt5", endpoint: "mt5-demo-accounts" },
  { server: "Exness-MT5Trial7", platform: "mt5", endpoint: "mt5-demo-accounts" },
  { server: "VantageInternational-Demo", platform: "mt5", endpoint: "mt5-demo-accounts" },
  { server: "ICMarketsSC-Demo", platform: "mt4", endpoint: "mt4-demo-accounts" },
  { server: "Pepperstone-Demo01", platform: "mt4", endpoint: "mt4-demo-accounts" },
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

    // Try to create demo account on various servers
    let demoAccount: any = null;
    let usedConfig: typeof DEMO_CONFIGS[0] | null = null;
    const errors: string[] = [];

    for (const config of DEMO_CONFIGS) {
      try {
        const url = `${META_PROV_BASE}/users/current/provisioning-profiles/default/${config.endpoint}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "auth-token": token, "Content-Type": "application/json" },
          body: JSON.stringify({
            balance: 10000,
            leverage: 500,
            serverName: config.server,
            email: user.email || "demo@goldfoundry.de",
            name: "Gold Foundry Demo",
            phone: body.phone || "+491000000000",
            accountType: "hedging",
          }),
          signal: AbortSignal.timeout(30000),
        });
        const data = await res.json();

        if (data.login && data.password) {
          demoAccount = data;
          usedConfig = config;
          break;
        }
        errors.push(`${config.server}: ${data.message || data.error || "Unbekannter Fehler"}`);
      } catch (e: any) {
        errors.push(`${config.server}: ${e.message}`);
      }
    }

    if (!demoAccount || !usedConfig) {
      return NextResponse.json({
        error: "Demo-Konto konnte auf keinem Server erstellt werden. Bitte versuche es in ein paar Minuten nochmal.",
        details: errors,
      }, { status: 503 });
    }

    // 2. Connect the demo account to MetaApi for trading
    let metaApiAccountId = "";
    try {
      const created = await metaApiFetch(`${META_PROV_BASE}/users/current/accounts`, token, {
        method: "POST",
        body: JSON.stringify({
          name: `GF-Demo-${demoAccount.login}`,
          type: "cloud-g2",
          login: String(demoAccount.login),
          password: demoAccount.password,
          server: demoAccount.serverName || usedConfig.server,
          platform: usedConfig.platform,
          application: "MetaApi",
          magic: 0,
        }),
      });
      metaApiAccountId = created._id || created.id;

      // Deploy
      await metaApiFetch(`${META_PROV_BASE}/users/current/accounts/${metaApiAccountId}/deploy`, token, {
        method: "POST",
      });

      // Wait for deployment (max 30s)
      const start = Date.now();
      while (Date.now() - start < 30000) {
        try {
          const acc = await metaApiFetch(`${META_PROV_BASE}/users/current/accounts/${metaApiAccountId}`, token);
          if (acc.state === "DEPLOYED" || acc.connectionStatus === "CONNECTED") break;
        } catch {}
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (e: any) {
      // Even if MetaApi connection fails, we still have the demo account credentials
      console.error("[DEMO] MetaApi connect failed:", e.message);
    }

    // 3. Save to DB
    const { data: saved, error: dbError } = await db
      .from("slave_accounts")
      .insert({
        user_id: user.id,
        metaapi_account_id: metaApiAccountId || `demo-${demoAccount.login}`,
        account_type: "demo",
        account_name: `Demo ${usedConfig.server.split("-")[0]}`,
        firm_profile: "tracking",
        broker_server: demoAccount.serverName || usedConfig.server,
        broker_name: usedConfig.server.split("-")[0],
        mt_login: String(demoAccount.login),
        mt_password: demoAccount.password,
        platform: usedConfig.platform,
        initial_balance: 10000,
        current_equity: 10000,
        equity_high: 10000,
        dd_limit: 0,
        dd_type: "fixed",
        currency: "USD",
        leverage: 500,
        copier_active: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[DEMO CREATE] DB Error:", dbError);
      // Still return the credentials even if DB save fails
      return NextResponse.json({
        success: true,
        warning: "Konto erstellt, aber Speichern fehlgeschlagen. Bitte notiere die Daten.",
        account: {
          login: demoAccount.login,
          password: demoAccount.password,
          investorPassword: demoAccount.investorPassword,
          server: demoAccount.serverName || usedConfig.server,
          platform: usedConfig.platform,
          balance: 10000,
        },
      });
    }

    return NextResponse.json({
      success: true,
      account: {
        id: saved.id,
        name: saved.account_name,
        login: demoAccount.login,
        password: demoAccount.password,
        investorPassword: demoAccount.investorPassword,
        server: demoAccount.serverName || usedConfig.server,
        balance: 10000,
        currency: "USD",
        leverage: 500,
        platform: usedConfig.platform,
      },
    });
  } catch (err) {
    console.error("[DEMO CREATE]", err);
    const message = err instanceof Error ? err.message : "Demo-Erstellung fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
