// src/app/dashboard/konto/page.tsx
"use client";
import { useState } from "react";

const AMOUNTS = [250, 500, 1000, 5000];

export default function KontoPage() {
  const [balance] = useState(0);
  const [equity] = useState(0);
  const [freeMargin] = useState(0);
  const hasAccount = balance > 0;

  return (
    <div className="space-y-6">
      <h1 className="gf-heading text-2xl">Konto</h1>

      {/* Balance Card */}
      <div className="gf-panel p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Balance</div>
            <div className="text-xl font-bold text-white">
              {hasAccount ? `\u20AC${balance.toLocaleString("de-DE")}` : "\u2014"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Equity</div>
            <div className="text-xl font-bold text-white">
              {hasAccount ? `\u20AC${equity.toLocaleString("de-DE")}` : "\u2014"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Freie Margin</div>
            <div className="text-xl font-bold text-white">
              {hasAccount ? `\u20AC${freeMargin.toLocaleString("de-DE")}` : "\u2014"}
            </div>
          </div>
        </div>
        {!hasAccount && (
          <p className="text-xs text-zinc-600 text-center mt-4">Verbinde dein Tegas FX Konto, um Echtzeit-Daten zu sehen.</p>
        )}
      </div>

      {/* Deposit */}
      <div className="gf-panel p-6">
        <h3 className="font-semibold text-white mb-4">Einzahlung</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          {AMOUNTS.map(a => (
            <button
              key={a}
              className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-all hover:bg-white/[0.03]"
              style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)", color: "var(--gf-text-bright)" }}
            >
              &euro;{a.toLocaleString("de-DE")}
            </button>
          ))}
        </div>
        <a
          href="https://tegasfx.com"
          target="_blank"
          rel="noopener noreferrer"
          className="gf-btn text-sm inline-block text-center"
        >
          Bei Tegas FX einzahlen &rarr;
        </a>
      </div>

      {/* Withdrawal */}
      <div className="gf-panel p-6">
        <h3 className="font-semibold text-white mb-4">Auszahlung</h3>
        <a
          href="https://tegasfx.com"
          target="_blank"
          rel="noopener noreferrer"
          className="gf-btn-outline text-sm inline-block text-center"
        >
          Bei Tegas FX auszahlen &rarr;
        </a>
      </div>

      {/* Note */}
      <div className="gf-panel p-4">
        <p className="text-xs text-zinc-500">
          Einzahlungen und Auszahlungen werden sicher ueber Tegas FX (VFSC reguliert) abgewickelt.
        </p>
      </div>

      {/* Transaction History */}
      <div className="gf-panel p-6">
        <h3 className="font-semibold text-white mb-4">Transaktionen</h3>
        <p className="text-sm text-zinc-600 text-center py-6">Keine Transaktionen vorhanden.</p>
      </div>
    </div>
  );
}
