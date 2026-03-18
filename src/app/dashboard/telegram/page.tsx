"use client";
import { useState } from "react";
import FeatureGate from "@/components/FeatureGate";

const DEMO_GROUPS = [
  { name: "XAUUSD VIP Signals", count: 247, winRate: 78, status: "aktiv" },
  { name: "Forex Elite", count: 189, winRate: 71, status: "aktiv" },
  { name: "Gold Scalper Pro", count: 312, winRate: 82, status: "aktiv" },
];

const DEMO_SIGNALS = [
  { time: "15:42", text: "BUY XAUUSD @ 2341.50, TP 2358.00, SL 2334.00", group: "XAUUSD VIP", status: "KOPIERT", pnl: "+€164,00" },
  { time: "14:18", text: "SELL EURUSD @ 1.0845, TP 1.0810, SL 1.0870", group: "Forex Elite", status: "KOPIERT", pnl: "+€87,50" },
  { time: "13:05", text: "BUY XAUUSD @ 2338.20, TP 2350.00, SL 2330.00", group: "Gold Scalper", status: "KOPIERT", pnl: "+€220,00" },
  { time: "11:30", text: "SELL GBPUSD @ 1.2680, TP 1.2640, SL 1.2710", group: "Forex Elite", status: "ÜBERSPRUNGEN", pnl: "—" },
  { time: "09:15", text: "BUY XAUUSD @ 2335.00, TP 2348.00, SL 2328.00", group: "XAUUSD VIP", status: "KOPIERT", pnl: "+€310,00" },
];

export default function TelegramCopierPage() {
  const [channelUrl, setChannelUrl] = useState("");

  return (
    <FeatureGate minTier="copier" featureName="Telegram Copier" landingPage="/telegram-copier">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>Telegram Copier</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>
            Signale aus Telegram-Gruppen automatisch auf dein MT-Konto kopieren
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider" style={{ background: "rgba(39,174,96,0.12)", color: "var(--gf-green)" }}>
          AKTIV · {DEMO_GROUPS.length} Gruppen
        </span>
      </div>

      {/* Add Channel */}
      <div className="gf-panel p-5">
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--gf-text-bright)" }}>Telegram-Kanal hinzufügen</div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://t.me/kanal oder @kanalname"
            className="gf-input flex-1"
            value={channelUrl}
            onChange={e => setChannelUrl(e.target.value)}
          />
          <button className="gf-btn px-4 text-sm whitespace-nowrap">Verbinden</button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--gf-text-dim)" }}>
          Der Bot scannt den Kanal, erkennt Signal-Formate und kopiert automatisch auf dein Konto.
        </p>
      </div>

      {/* Connected Groups */}
      <div className="gf-panel p-5">
        <div className="text-[10px] tracking-widest mb-4" style={{ color: "var(--gf-text-dim)" }}>VERBUNDENE SIGNAL-GRUPPEN</div>
        <div className="grid md:grid-cols-3 gap-3">
          {DEMO_GROUPS.map((g, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: "var(--gf-text-bright)" }}>{g.name}</span>
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--gf-green)" }} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--gf-text-dim)" }}>
                <div>{g.count} Signale</div>
                <div>Win Rate: <span style={{ color: "var(--gf-green)" }}>{g.winRate}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Orders Config */}
      <div className="gf-panel p-5">
        <div className="text-[10px] tracking-widest mb-4" style={{ color: "var(--gf-text-dim)" }}>SMART ORDERS</div>
        <div className="flex flex-wrap gap-3">
          {["4-Split TP aktiv", "Auto-Breakeven aktiv", "Trailing Runner aktiv", "Risk Shield aktiv"].map((s, i) => (
            <span key={i} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(212,165,55,0.15)" }}>
              ✓ {s}
            </span>
          ))}
        </div>
      </div>

      {/* Signal History */}
      <div className="gf-panel p-5">
        <div className="text-[10px] tracking-widest mb-4" style={{ color: "var(--gf-text-dim)" }}>LETZTE SIGNALE</div>
        <div className="space-y-2">
          {DEMO_SIGNALS.map((s, i) => (
            <div key={i} className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-lg" style={{ background: "var(--gf-obsidian)" }}>
              <div className="flex items-center gap-3">
                <span className="text-xs mono" style={{ color: "var(--gf-text-dim)" }}>{s.time}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)" }}>{s.group}</span>
                <span className="text-sm mono" style={{ color: "var(--gf-text-bright)" }}>{s.text}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  s.status === "KOPIERT"
                    ? "text-[var(--gf-green)]"
                    : "text-yellow-500"
                }`} style={{ background: s.status === "KOPIERT" ? "rgba(39,174,96,0.12)" : "rgba(234,179,8,0.12)" }}>
                  {s.status}
                </span>
                <span className="text-sm mono font-medium" style={{ color: s.pnl.startsWith("+") ? "var(--gf-green)" : "var(--gf-text-dim)" }}>{s.pnl}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Notice */}
      <div className="text-center">
        <span className="inline-block px-4 py-2 rounded-full text-xs" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(212,165,55,0.15)" }}>
          DEMO DATEN — Verbinde dein MT-Konto und Telegram-Kanäle um live zu kopieren
        </span>
      </div>
    </div>
    </FeatureGate>
  );
}
