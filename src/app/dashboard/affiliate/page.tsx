// src/app/dashboard/affiliate/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function AffiliatePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");

  useEffect(() => { loadData(); }, []);
  function loadData() {
    fetch("/api/affiliate/profile").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }

  async function applyAsAffiliate() {
    setApplying(true);
    await fetch("/api/affiliate/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partnerType: "affiliate", payoutMethod: "usdt", payoutDetails: {} }) });
    loadData(); setApplying(false);
  }

  async function createLink() {
    if (!newLink) return;
    await fetch("/api/affiliate/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignName: newLink }) });
    setNewLink(""); loadData();
  }

  async function requestPayout() {
    const amount = parseFloat(payoutAmount);
    if (!amount) return;
    await fetch("/api/affiliate/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) });
    setPayoutAmount(""); loadData();
  }

  if (loading) return <div className="py-20 text-center" style={{ color: "var(--gf-text-dim)" }}>Laden...</div>;

  if (!data?.profile) return (
    <div className="py-20 text-center">
      <div className="text-4xl mb-4">💰</div>
      <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--gf-text-bright)" }}>Werde Gold Foundry Partner</h2>
      <p className="mb-6 max-w-md mx-auto" style={{ color: "var(--gf-text-dim)" }}>Verdiene Bis zu 50% Provision auf 3 Ebenen. Passives Einkommen durch dein Netzwerk.</p>
      <button onClick={applyAsAffiliate} className="gf-btn" disabled={applying}>{applying ? "..." : "Jetzt Partner werden →"}</button>
    </div>
  );

  const s = data.stats;
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>💰 Partner Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>Tier: <span className="font-semibold gf-gold-text">{data.profile.tier?.toUpperCase()}</span> · {data.profile.partnerType}</p></div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { l: "Verdient (gesamt)", v: `${s.totalEarned?.toFixed(2)} \u20ac` },
          { l: "Auszahlbar", v: `${s.currentBalance?.toFixed(2)} \u20ac`, c: "var(--gf-gold)" },
          { l: "Aktive Referrals", v: s.activeReferrals },
          { l: "Klicks (7 Tage)", v: s.weekClicks },
          { l: "Conversion Rate", v: `${s.conversionRate}%` },
        ].map((k, i) => (
          <div key={i} className="gf-panel p-4 text-center">
            <div className="text-xl font-bold" style={{ color: k.c ?? "var(--gf-text-bright)" }}>{k.v}</div>
            <div className="text-[10px] mt-1" style={{ color: "var(--gf-text-dim)" }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* REFERRAL LINK */}
      <div className="gf-panel p-5 mb-6">
        <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>DEIN REFERRAL LINK</div>
        <div className="flex gap-2">
          <input className="gf-input mono text-sm" readOnly value={`https://goldfoundry.de/r/${data.profile.customSlug}`} onClick={e => (e.target as HTMLInputElement).select()} />
          <button className="gf-btn !px-4 text-sm" onClick={() => navigator.clipboard.writeText(`https://goldfoundry.de/r/${data.profile.customSlug}`)}>Copy</button>
        </div>
      </div>

      {/* LINKS + PAYOUT in 2 columns */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Custom Links */}
        <div className="gf-panel p-5">
          <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>TRACKING LINKS</div>
          <div className="flex gap-2 mb-3">
            <input className="gf-input text-sm" placeholder="Campaign Name" value={newLink} onChange={e => setNewLink(e.target.value)} />
            <button className="gf-btn text-xs !px-3" onClick={createLink}>+</button>
          </div>
          {data.links?.map((l: any) => (
            <div key={l.id} className="flex justify-between py-2 text-xs" style={{ borderBottom: "1px solid var(--gf-border)" }}>
              <span style={{ color: "var(--gf-text-bright)" }}>{l.campaign_name}</span>
              <span style={{ color: "var(--gf-text-dim)" }}>{l.clicks} Klicks · {l.conversions} Conv</span>
            </div>
          ))}
        </div>

        {/* Payout */}
        <div className="gf-panel p-5">
          <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>AUSZAHLUNG</div>
          <p className="text-sm mb-3" style={{ color: "var(--gf-text-dim)" }}>Guthaben: <span className="font-bold gf-gold-text">{s.currentBalance?.toFixed(2)} \u20ac</span></p>
          <div className="flex gap-2">
            <input className="gf-input text-sm" type="number" placeholder="Betrag (\u20ac)" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} />
            <button className="gf-btn text-xs !px-4" onClick={requestPayout}>Auszahlen</button>
          </div>
          {data.pendingPayouts?.map((p: any) => (
            <div key={p.id} className="flex justify-between py-2 mt-2 text-xs" style={{ borderBottom: "1px solid var(--gf-border)" }}>
              <span style={{ color: "var(--gf-gold)" }}>{p.amount} \u20ac</span>
              <span className="px-2 py-0.5 rounded" style={{ background: "rgba(212,165,55,0.1)", color: "var(--gf-gold)" }}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STRUCTURE */}
      <div className="gf-panel p-5">
        <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>NETZWERK-STRUKTUR</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{data.structure?.stats?.l1Count ?? 0}</div><div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Level 1 (bis 50%)</div></div>
          <div><div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{data.structure?.stats?.l2Count ?? 0}</div><div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Level 2 (10%)</div></div>
          <div><div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{data.structure?.stats?.l3Count ?? 0}</div><div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Level 3 (5%)</div></div>
        </div>
      </div>
    </div>
  );
}
