// ═══════════════════════════════════════════════════════════════
// src/lib/supabase-admin.ts — EIN Supabase Client für das Backend
// Alle Module importieren: import { supabaseAdmin } from "@/lib/supabase-admin"
// ═══════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return _client;
}

// Lazy proxy — only connects when first property is accessed
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabaseAdmin(), prop);
  },
});
