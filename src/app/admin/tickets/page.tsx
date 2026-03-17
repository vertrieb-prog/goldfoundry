import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminTickets() {
  const { data: tickets } = await supabaseAdmin
    .from("support_tickets")
    .select("*, profiles:user_id(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const priorityColor: Record<string, string> = {
    critical: "text-red-400", high: "text-orange-400", medium: "text-yellow-400", low: "text-[#5a4f3a]",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#d4a537] mb-6">Support Tickets</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#5a4f3a] border-b border-[#2a2218]">
            <th className="py-2">#</th><th>Subject</th><th>User</th><th>Priority</th><th>Status</th><th>Created</th>
          </tr>
        </thead>
        <tbody>
          {(tickets || []).map((t: any) => (
            <tr key={t.id} className="border-b border-[#1a1710]">
              <td className="py-2 text-[#5a4f3a]">#{t.id}</td>
              <td className="text-[#e8dcc0]">{t.subject}</td>
              <td className="text-[#a09070]">{t.profiles?.full_name || t.profiles?.email || "—"}</td>
              <td className={priorityColor[t.priority] || ""}>{t.priority}</td>
              <td><span className="px-2 py-0.5 bg-[#1a1710] rounded text-xs">{t.status}</span></td>
              <td className="text-[#5a4f3a]">{new Date(t.created_at).toLocaleDateString("de")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
