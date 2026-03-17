import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, subscription_tier, role, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#d4a537] mb-6">Users</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#5a4f3a] border-b border-[#2a2218]">
            <th className="py-2">Name</th><th>Email</th><th>Tier</th><th>Role</th><th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {(users || []).map(u => (
            <tr key={u.id} className="border-b border-[#1a1710]">
              <td className="py-2 text-[#e8dcc0]">{u.full_name || "—"}</td>
              <td className="text-[#a09070]">{u.email}</td>
              <td><span className="px-2 py-0.5 bg-[#1a1710] rounded text-xs">{u.subscription_tier || "free"}</span></td>
              <td className="text-[#5a4f3a]">{u.role || "user"}</td>
              <td className="text-[#5a4f3a]">{new Date(u.created_at).toLocaleDateString("de")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
