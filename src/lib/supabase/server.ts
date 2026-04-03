// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Server Component — ignore */ }
        },
      },
    }
  );
}

// Service role client for cron jobs and admin operations
// No singleton — Supabase JS client caches internal state across Vercel function reuse
export function createSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Raw REST query — bypasses Supabase JS client caching issues on Vercel Fluid Compute
export async function supabaseRestQuery(table: string, params?: string): Promise<any[]> {
  const supaUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!;
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)!;
  const url = `${supaUrl}/rest/v1/${table}${params ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase REST ${res.status}: ${await res.text()}`);
  return res.json();
}

// Convenience: fetch all active slave accounts via raw REST
export async function fetchActiveSlaveAccounts(): Promise<any[]> {
  return supabaseRestQuery("slave_accounts", "select=*&copier_active=eq.true");
}
