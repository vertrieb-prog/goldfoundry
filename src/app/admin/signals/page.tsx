// src/app/admin/signals/page.tsx — Admin: Signal (Master) Account Management
"use client";
import { useEffect, useState } from "react";

interface Master {
  id: string;
  metaapi_account_id: string;
  name: string;
  strategy_type: string;
  instruments: string[];
  description: string | null;
  active: boolean;
  created_at: string;
}

export default function AdminSignalsPage() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Form
  const [name, setName] = useState("");
  const [metaapiId, setMetaapiId] = useState("");
  const [strategyType, setStrategyType] = useState("");
  const [instruments, setInstruments] = useState("XAUUSD, US500");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadMasters();
  }, []);

  function loadMasters() {
    fetch("/api/admin/accounts")
      .then(r => r.json())
      .then(d => { setMasters(d.masters ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  async function handleCreate() {
    if (!name || !metaapiId || !strategyType) { setError("Name, MetaApi ID und Strategie erforderlich"); return; }
    setCreating(true); setError("");

    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "master",
          name, metaapiAccountId: metaapiId, strategyType,
          instruments: instruments.split(",").map(s => s.trim()).filter(Boolean),
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Fehler"); setCreating(false); return; }
      setShowCreate(false);
      setName(""); setMetaapiId(""); setStrategyType(""); setDescription("");
      loadMasters();
    } catch { setError("Netzwerkfehler"); }
    setCreating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>Signal-Konten</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>Master-Accounts für den Copier — hier laufen eure Trading-Bots</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="gf-btn text-sm !py-2.5 !px-6">
          + Signal-Konto
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="gf-panel p-6 mb-6 animate-in">
          <h3 className="font-semibold mb-4" style={{ color: "var(--gf-text-bright)" }}>Neues Signal-Konto erstellen</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Name</label>
              <input className="gf-input" placeholder="z.B. XAUUSD Scalper Bot" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>MetaApi Account ID</label>
              <input className="gf-input mono" placeholder="MetaApi Account UUID" value={metaapiId} onChange={e => setMetaapiId(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Strategie-Typ</label>
              <input className="gf-input" placeholder="z.B. scalping, swing, grid" value={strategyType} onChange={e => setStrategyType(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Instrumente</label>
              <input className="gf-input" placeholder="XAUUSD, US500, EURUSD" value={instruments} onChange={e => setInstruments(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Beschreibung (optional)</label>
              <input className="gf-input" placeholder="Kurzbeschreibung der Strategie" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm mt-3" style={{ color: "var(--gf-red)" }}>{error}</p>}

          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowCreate(false)} className="gf-btn-outline text-sm !py-2 !px-4">Abbrechen</button>
            <button onClick={handleCreate} disabled={creating} className="gf-btn text-sm !py-2 !px-6">
              {creating ? "Erstelle..." : "Signal-Konto erstellen"}
            </button>
          </div>
        </div>
      )}

      {/* Master Accounts List */}
      {masters.length === 0 ? (
        <div className="gf-panel p-12 text-center">
          <div className="text-4xl mb-3">📡</div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--gf-text-bright)" }}>Keine Signal-Konten</h2>
          <p className="text-sm" style={{ color: "var(--gf-text-dim)" }}>
            Erstelle dein erstes Signal-Konto um den Copier zu starten.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {masters.map(m => (
            <div key={m.id} className="gf-panel p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(212,165,55,0.1)", border: "1px solid rgba(212,165,55,0.2)" }}>
                    📡
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: "var(--gf-text-bright)" }}>{m.name}</div>
                    <div className="text-xs mono mt-0.5" style={{ color: "var(--gf-text-dim)" }}>ID: {m.metaapi_account_id}</div>
                    {m.description && <div className="text-xs mt-1" style={{ color: "var(--gf-text)" }}>{m.description}</div>}
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{
                  background: m.active ? "rgba(39,174,96,0.1)" : "rgba(192,57,43,0.1)",
                  color: m.active ? "var(--gf-green)" : "var(--gf-red)",
                  border: `1px solid ${m.active ? "rgba(39,174,96,0.2)" : "rgba(192,57,43,0.2)"}`,
                }}>
                  {m.active ? "AKTIV" : "INAKTIV"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 text-sm" style={{ borderTop: "1px solid var(--gf-border)" }}>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Strategie</div>
                  <div style={{ color: "var(--gf-text-bright)" }}>{m.strategy_type}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Instrumente</div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {m.instruments.map(inst => (
                      <span key={inst} className="text-[10px] px-1.5 py-0.5 rounded mono" style={{ background: "rgba(255,255,255,0.04)", color: "var(--gf-text)" }}>{inst}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Erstellt</div>
                  <div style={{ color: "var(--gf-text)" }}>{new Date(m.created_at).toLocaleDateString("de-DE")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
