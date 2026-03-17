import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminPartners() {
  const { data: partners } = await supabaseAdmin
    .from("affiliate_profiles")
    .select("*, profiles(email, full_name)")
    .order("total_earned", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#d4a537] mb-6">Partners</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#5a4f3a] border-b border-[#2a2218]">
            <th className="py-2">Name</th><th>Tier</th><th>Referrals</th><th>Earned (€)</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {(partners || []).map((p: any) => (
            <tr key={p.id} className="border-b border-[#1a1710]">
              <td className="py-2 text-[#e8dcc0]">{p.profiles?.full_name || p.profiles?.email || "—"}</td>
              <td><span className="px-2 py-0.5 bg-[#1a1710] rounded text-xs text-[#d4a537]">{p.tier}</span></td>
              <td className="text-[#a09070]">{p.active_referrals || 0}</td>
              <td className="text-[#d4a537] font-medium">€{Number(p.total_earned || 0).toFixed(2)}</td>
              <td className="text-[#5a4f3a]">{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
