// src/app/admin/crm/page.tsx — Admin CRM Dashboard
"use client";
import { useEffect, useState } from "react";

interface DashboardData {
  totalContacts: number;
  contactsByStatus: Record<string, number>;
  contactsBySource: Record<string, number>;
  avgScore: number;
  recentContacts: any[];
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  created_at: string;
  crm_contacts: { email: string; full_name: string; status: string } | null;
}

interface Pipeline {
  [key: string]: { count: number; value: number };
}

export default function AdminCRMPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline>({});
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "contacts" | "pipeline">("overview");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/dashboard").then(r => r.ok ? r.json() : null),
      fetch("/api/crm/deals").then(r => r.ok ? r.json() : { deals: [], pipeline: {} }),
      fetch("/api/crm/contacts?limit=100").then(r => r.ok ? r.json() : { contacts: [] }),
    ]).then(([dash, dealData, contactData]) => {
      setDashboard(dash);
      setDeals(dealData.deals ?? []);
      setPipeline(dealData.pipeline ?? {});
      setContacts(contactData.contacts ?? contactData ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const stages = ["new", "contacted", "demo", "negotiation", "won", "lost"];
  const stageLabels: Record<string, string> = { new: "Neu", contacted: "Kontaktiert", demo: "Demo", negotiation: "Verhandlung", won: "Gewonnen", lost: "Verloren" };
  const stageColors: Record<string, string> = { new: "#a3a3a3", contacted: "#3498db", demo: "#d4a537", negotiation: "#e67e22", won: "#27ae60", lost: "#c0392b" };

  const filteredContacts = search
    ? contacts.filter((c: any) => {
        const s = search.toLowerCase();
        return (c.email ?? "").toLowerCase().includes(s) || (c.full_name ?? "").toLowerCase().includes(s);
      })
    : contacts;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--gf-text-bright)" }}>CRM</h1>
      <p className="text-sm mb-6" style={{ color: "var(--gf-text-dim)" }}>Kontakte, Pipeline und Kampagnen</p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-6 inline-flex" style={{ background: "rgba(255,255,255,0.03)" }}>
        {(["overview", "contacts", "pipeline"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-md text-xs font-medium transition-all" style={{
            background: tab === t ? "rgba(212,165,55,0.1)" : "transparent",
            color: tab === t ? "var(--gf-gold)" : "var(--gf-text-dim)",
          }}>
            {t === "overview" ? "Übersicht" : t === "contacts" ? "Kontakte" : "Pipeline"}
          </button>
        ))}
      </div>

      {tab === "overview" && dashboard && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            <div className="gf-panel p-4">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Kontakte</div>
              <div className="text-2xl font-bold mono" style={{ color: "var(--gf-text-bright)" }}>{dashboard.totalContacts}</div>
            </div>
            <div className="gf-panel p-4">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Ø Lead Score</div>
              <div className="text-2xl font-bold mono" style={{ color: "var(--gf-gold)" }}>{Math.round(dashboard.avgScore)}</div>
            </div>
            <div className="gf-panel p-4">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Deals offen</div>
              <div className="text-2xl font-bold mono" style={{ color: "var(--gf-text-bright)" }}>
                {Object.entries(pipeline).filter(([k]) => !["won", "lost"].includes(k)).reduce((s, [, v]) => s + (v as any).count, 0)}
              </div>
            </div>
            <div className="gf-panel p-4">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Pipeline-Wert</div>
              <div className="text-2xl font-bold mono" style={{ color: "var(--gf-green)" }}>
                ${Object.entries(pipeline).filter(([k]) => !["won", "lost"].includes(k)).reduce((s, [, v]) => s + (v as any).value, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="gf-panel p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--gf-text-bright)" }}>Nach Status</h3>
              {Object.entries(dashboard.contactsByStatus ?? {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="capitalize" style={{ color: "var(--gf-text)" }}>{status}</span>
                  <span className="mono font-medium" style={{ color: "var(--gf-text-bright)" }}>{count as number}</span>
                </div>
              ))}
            </div>
            <div className="gf-panel p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--gf-text-bright)" }}>Nach Quelle</h3>
              {Object.entries(dashboard.contactsBySource ?? {}).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="capitalize" style={{ color: "var(--gf-text)" }}>{source}</span>
                  <span className="mono font-medium" style={{ color: "var(--gf-text-bright)" }}>{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "contacts" && (
        <>
          <input type="text" placeholder="Suchen... (Name, Email)" value={search} onChange={e => setSearch(e.target.value)}
            className="gf-input !w-64 text-sm mb-4" />
          <div className="gf-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
                    {["Name", "Email", "Status", "Score", "Tags", "Quelle", "Erstellt"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--gf-text-dim)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center" style={{ color: "var(--gf-text-dim)" }}>Keine Kontakte</td></tr>
                  ) : filteredContacts.map((c: any) => (
                    <tr key={c.id} className="transition-colors hover:bg-white/[0.01]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td className="px-4 py-3" style={{ color: "var(--gf-text-bright)" }}>{c.full_name ?? "—"}</td>
                      <td className="px-4 py-3 mono text-xs" style={{ color: "var(--gf-text)" }}>{c.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{
                          background: c.status === "customer" ? "rgba(39,174,96,0.1)" : "rgba(255,255,255,0.05)",
                          color: c.status === "customer" ? "var(--gf-green)" : "var(--gf-text)",
                        }}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 mono font-medium" style={{ color: (c.lead_score ?? 0) > 50 ? "var(--gf-gold)" : "var(--gf-text-dim)" }}>
                        {c.lead_score ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(c.tags ?? []).slice(0, 3).map((t: string) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "var(--gf-text-dim)" }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize" style={{ color: "var(--gf-text-dim)" }}>{c.source ?? "—"}</td>
                      <td className="px-4 py-3 text-[10px] mono" style={{ color: "var(--gf-text-dim)" }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("de-DE") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "pipeline" && (
        <>
          {/* Pipeline Stages */}
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6 mb-6">
            {stages.map(stage => {
              const data = (pipeline as any)[stage] ?? { count: 0, value: 0 };
              return (
                <div key={stage} className="gf-panel p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: stageColors[stage] }} />
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: stageColors[stage] }}>{stageLabels[stage]}</span>
                  </div>
                  <div className="text-lg font-bold mono" style={{ color: "var(--gf-text-bright)" }}>{data.count}</div>
                  <div className="text-[10px] mono" style={{ color: "var(--gf-text-dim)" }}>${data.value.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          {/* Deal List */}
          <div className="gf-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
                    {["Deal", "Kontakt", "Stage", "Wert", "Erstellt"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--gf-text-dim)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deals.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: "var(--gf-text-dim)" }}>Keine Deals</td></tr>
                  ) : deals.map(d => (
                    <tr key={d.id} className="transition-colors hover:bg-white/[0.01]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td className="px-4 py-3" style={{ color: "var(--gf-text-bright)" }}>{d.title}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--gf-text)" }}>
                        {d.crm_contacts?.full_name ?? d.crm_contacts?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${stageColors[d.stage]}20`, color: stageColors[d.stage] }}>
                          {stageLabels[d.stage] ?? d.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 mono font-medium" style={{ color: "var(--gf-gold)" }}>${Number(d.value).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[10px] mono" style={{ color: "var(--gf-text-dim)" }}>
                        {new Date(d.created_at).toLocaleDateString("de-DE")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
