// src/app/dashboard/affiliate/page.tsx
"use client";
import { useEffect, useState } from "react";

const DEMO_STATS = {
  totalEarned: 1247.80,
  currentBalance: 487.50,
  activeReferrals: 23,
  weekClicks: 1842,
  conversionRate: 8.4,
};

const DEMO_LINKS = [
  { id: "l1", campaign_name: "Instagram Bio", clicks: 342, conversions: 12 },
  { id: "l2", campaign_name: "WhatsApp Status", clicks: 187, conversions: 8 },
  { id: "l3", campaign_name: "YouTube Desc", clicks: 89, conversions: 3 },
];

const DEMO_CONVERSIONS = [
  { id: "c1", name: "M. Schneider", date: "15.03.2026", product: "TEGAS FX 50K", commission: 149.50, level: "L1" },
  { id: "c2", name: "T. Weber", date: "12.03.2026", product: "TAG Markets 25K", commission: 89.00, level: "L1" },
  { id: "c3", name: "A. Klein", date: "10.03.2026", product: "TEGAS FX 100K", commission: 249.00, level: "L1" },
  { id: "c4", name: "S. Braun", date: "08.03.2026", product: "TAG Markets 50K", commission: 44.50, level: "L2" },
  { id: "c5", name: "J. Fischer", date: "05.03.2026", product: "TEGAS FX 25K", commission: 22.25, level: "L2" },
];

const BUILDER_PACKS = [
  { count: 5, price: 99, label: "5er Pack" },
  { count: 10, price: 179, label: "10er Pack" },
  { count: 25, price: 399, label: "25er Pack" },
  { count: 50, price: 699, label: "50er Pack" },
];

export default function AffiliatePage() {
  const [data, setData] = useState<any>({
    profile: { tier: "SILVER", partnerType: "affiliate", customSlug: "eric-phoenix" },
    stats: DEMO_STATS,
    links: DEMO_LINKS,
    structure: { stats: { l1Count: 23, l2Count: 8, l3Count: 2 } },
    pendingPayouts: [],
    conversions: DEMO_CONVERSIONS,
  });
  const [isDemo, setIsDemo] = useState(true);
  const [newLink, setNewLink] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");

  useEffect(() => {
    fetch("/api/affiliate/profile")
      .then(r => r.json())
      .then(d => {
        if (d.profile) {
          setData(d);
          setIsDemo(false);
        }
      })
      .catch(() => {});
  }, []);

  async function createLink() {
    if (!newLink) return;
    if (!isDemo) {
      await fetch("/api/affiliate/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignName: newLink }) }).catch(() => {});
    }
    setNewLink("");
  }

  async function requestPayout() {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) return;
    if (amount > (s.currentBalance ?? 0)) {
      alert("Guthaben nicht ausreichend");
      return;
    }
    if (!isDemo) {
      await fetch("/api/affiliate/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) }).catch(() => {});
    }
    setPayoutAmount("");
  }

  const s = data.stats;

  return (
    <div>
      {isDemo && (
        <div
          className="fixed top-20 right-6 z-50 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
          style={{
            background: "linear-gradient(135deg, rgba(212,165,55,0.15), rgba(212,165,55,0.05))",
            border: "1px solid rgba(212,165,55,0.25)",
            color: "var(--gf-gold)",
            boxShadow: "0 4px 20px rgba(212,165,55,0.1)",
          }}
        >
          DEMO DATA
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>Partner Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>
            Tier: <span className="font-semibold gf-gold-text">{data.profile.tier?.toUpperCase()}</span> &middot; {data.profile.partnerType}
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { l: "Verdient (gesamt)", v: `€${s.totalEarned?.toFixed(2)}`, c: "var(--gf-green)" },
          { l: "Auszahlbar", v: `€${s.currentBalance?.toFixed(2)}`, c: "var(--gf-gold)" },
          { l: "Aktive Referrals", v: s.activeReferrals },
          { l: "Klicks (gesamt)", v: s.weekClicks?.toLocaleString("de-DE") },
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

      {/* PROVISION RATES */}
      <div className="gf-panel p-5 mb-6">
        <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>PROVISIONS-S&Auml;TZE</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold gf-gold-text">30%</div>
            <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Level 1 (direkt)</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>10%</div>
            <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Level 2</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>5%</div>
            <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Level 3</div>
          </div>
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
              <span style={{ color: "var(--gf-text-dim)" }}>{l.clicks} Klicks &middot; {l.conversions} Conv</span>
            </div>
          ))}
        </div>

        {/* Payout */}
        <div className="gf-panel p-5">
          <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>AUSZAHLUNG</div>
          <p className="text-sm mb-3" style={{ color: "var(--gf-text-dim)" }}>Guthaben: <span className="font-bold gf-gold-text">€{s.currentBalance?.toFixed(2)}</span></p>
          <div className="flex gap-2">
            <input className="gf-input text-sm" type="number" placeholder="Betrag (€)" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} />
            <button className="gf-btn text-xs !px-4" onClick={requestPayout}>Auszahlen</button>
          </div>
          {data.pendingPayouts?.map((p: any) => (
            <div key={p.id} className="flex justify-between py-2 mt-2 text-xs" style={{ borderBottom: "1px solid var(--gf-border)" }}>
              <span style={{ color: "var(--gf-gold)" }}>{p.amount} €</span>
              <span className="px-2 py-0.5 rounded" style={{ background: "rgba(212,165,55,0.1)", color: "var(--gf-gold)" }}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT CONVERSIONS */}
      <div className="gf-panel p-5 mb-6">
        <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>LETZTE CONVERSIONS</div>
        <div className="space-y-0">
          {(data.conversions ?? DEMO_CONVERSIONS).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--gf-border)" }}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{
                  background: c.level === "L1" ? "rgba(212,165,55,0.1)" : "rgba(212,165,55,0.05)",
                  color: "var(--gf-gold)",
                }}>{c.level}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--gf-text-bright)" }}>{c.name}</div>
                  <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>{c.product} &middot; {c.date}</div>
                </div>
              </div>
              <span className="text-sm font-bold" style={{ color: "var(--gf-green)" }}>+€{c.commission.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* NETWORK STRUCTURE */}
      <div className="gf-panel p-5 mb-6">
        <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>NETZWERK-STRUKTUR</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{data.structure?.stats?.l1Count ?? 0}</div>
            <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Level 1 (30%)</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{data.structure?.stats?.l2Count ?? 0}</div>
            <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Level 2 (10%)</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{data.structure?.stats?.l3Count ?? 0}</div>
            <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Level 3 (5%)</div>
          </div>
        </div>
      </div>

      {/* BUILDER PACKS */}
      <div className="gf-panel p-5">
        <div className="text-xs tracking-widest mb-4" style={{ color: "var(--gf-text-dim)" }}>BUILDER PACKS</div>
        <p className="text-sm mb-4" style={{ color: "var(--gf-text-dim)" }}>Kaufe Challenge-Gutscheine in Bulk und verdiene mehr pro Conversion.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {BUILDER_PACKS.map((p) => (
            <div key={p.count} className="gf-panel p-4 text-center" style={{
              background: "linear-gradient(135deg, var(--gf-panel), rgba(212,165,55,0.03))",
              border: "1px solid rgba(212,165,55,0.12)",
            }}>
              <div className="text-lg font-bold gf-gold-text">{p.label}</div>
              <div className="text-2xl font-bold mt-1" style={{ color: "var(--gf-text-bright)" }}>€{p.price}</div>
              <div className="text-[10px] mt-1" style={{ color: "var(--gf-text-dim)" }}>€{(p.price / p.count).toFixed(2)} pro Stück</div>
              <button className="gf-btn-outline text-xs !px-4 !py-1.5 mt-3 w-full">Kaufen</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
