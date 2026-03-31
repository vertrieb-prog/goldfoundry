"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TOTAL_STEPS = 3;

const TRADERS = [
  { id: "phantom", name: "PHANTOM", asset: "XAUUSD", perf: "+1.0%/Tag", wr: "72%" },
  { id: "nexus", name: "NEXUS", asset: "US500", perf: "+0.7%/Tag", wr: "68%" },
  { id: "sentinel", name: "SENTINEL", asset: "DAX40", perf: "+0.8%/Tag", wr: "65%" },
  { id: "spectre", name: "SPECTRE", asset: "EURUSD", perf: "+0.5%/Tag", wr: "74%" },
];

const AMOUNTS = [250, 500, 1000, 5000];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [tegasAccount, setTegasAccount] = useState("");
  const [depositAmount, setDepositAmount] = useState<number | "demo" | null>(null);
  const [selectedTraders, setSelectedTraders] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const router = useRouter();

  const goTo = (target: number) => {
    if (animating) return;
    setAnimDir(target > step ? "forward" : "back");
    setAnimating(true);
    setTimeout(() => { setStep(target); setAnimating(false); }, 250);
  };

  const toggleTrader = (id: string) => {
    setSelectedTraders((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tegas_account: tegasAccount || undefined,
          deposit_amount: depositAmount,
          selected_traders: selectedTraders,
          onboarding_completed: true,
        }),
      });
    } catch { /* continue */ }
    router.push("/dashboard");
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 600, height: 600, top: "10%", left: "50%", transform: "translateX(-50%)" }} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Progress */}
        <div className="w-full max-w-lg mb-8">
          <div className="flex items-center justify-between mb-3">
            {step > 1 && (
              <button onClick={() => goTo(step - 1)} className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                <span>&larr;</span> Zurueck
              </button>
            )}
            <span className="text-xs text-zinc-600 font-mono ml-auto">Schritt {step} / {TOTAL_STEPS}</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--gf-border)" }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: "var(--gf-gold)" }} />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: s <= step ? "var(--gf-gold)" : "var(--gf-panel)",
                    color: s <= step ? "var(--gf-obsidian)" : "var(--gf-text-dim)",
                    border: s === step ? "2px solid var(--gf-gold)" : "1px solid var(--gf-border)",
                  }}
                >
                  {s}
                </div>
                <span className="text-[10px] text-zinc-600 hidden sm:inline">
                  {s === 1 ? "Konto" : s === 2 ? "Einzahlung" : "Trader"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div
          className="w-full max-w-lg"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? (animDir === "forward" ? "translateX(30px)" : "translateX(-30px)") : "translateX(0)",
            transition: "all 0.25s ease",
          }}
        >
          {/* Step 1: Tegas FX Konto */}
          {step === 1 && (
            <div>
              <h1 className="gf-heading text-3xl md:text-4xl mb-3">
                Willkommen bei <span className="gf-gold-text">Gold Foundry</span>!
              </h1>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                Dein reguliertes Trading-Konto wird ueber Tegas FX gefuehrt.
              </p>

              <div className="mb-6">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Tegas FX Kontonummer
                </label>
                <input
                  type="text"
                  value={tegasAccount}
                  onChange={(e) => setTegasAccount(e.target.value)}
                  placeholder="z.B. 12345678"
                  className="gf-input"
                />
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1" style={{ background: "var(--gf-border)" }} />
                <span className="text-xs text-zinc-600">ODER</span>
                <div className="h-px flex-1" style={{ background: "var(--gf-border)" }} />
              </div>

              <a
                href="https://tegasfx.com/?ref=goldfoundry"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 px-4 rounded-xl text-sm font-medium transition-colors mb-6"
                style={{ background: "var(--gf-panel)", border: "1px solid var(--gf-border)", color: "var(--gf-gold)" }}
              >
                Noch kein Konto? Bei Tegas FX registrieren &rarr;
              </a>

              <div className="p-4 rounded-xl text-xs text-zinc-500 leading-relaxed" style={{ background: "rgba(250,239,112,0.03)", border: "1px solid rgba(250,239,112,0.08)" }}>
                Tegas FX ist ein MISA-lizenzierter ECN/STP Broker mit segregierten Kundengeldern.
              </div>

              <button onClick={() => goTo(2)} className="gf-btn w-full mt-6">
                Weiter &rarr;
              </button>
            </div>
          )}

          {/* Step 2: Einzahlung */}
          {step === 2 && (
            <div>
              <h2 className="gf-heading text-2xl mb-2">Kapital einzahlen</h2>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                Waehle einen Betrag fuer den Start.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(amt)}
                    className="p-4 rounded-xl text-center transition-all duration-200"
                    style={{
                      background: depositAmount === amt ? "rgba(250,239,112,0.06)" : "var(--gf-panel)",
                      border: `2px solid ${depositAmount === amt ? "var(--gf-gold)" : "var(--gf-border)"}`,
                    }}
                  >
                    <div className="text-lg font-bold text-white">
                      {amt >= 1000 ? `${(amt / 1000).toFixed(0)}.000` : amt} &euro;
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setDepositAmount("demo")}
                className="w-full p-3 rounded-xl text-sm transition-all duration-200 mb-6"
                style={{
                  background: depositAmount === "demo" ? "rgba(250,239,112,0.06)" : "var(--gf-panel)",
                  border: `2px solid ${depositAmount === "demo" ? "var(--gf-gold)" : "var(--gf-border)"}`,
                  color: depositAmount === "demo" ? "var(--gf-gold)" : "var(--gf-text-dim)",
                }}
              >
                Erst Demo testen
              </button>

              {depositAmount && depositAmount !== "demo" && (
                <a
                  href="https://tegasfx.com/deposit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 px-4 rounded-xl text-sm font-medium transition-colors mb-4"
                  style={{ background: "var(--gf-panel)", border: "1px solid var(--gf-border)", color: "var(--gf-gold)" }}
                >
                  Bei Tegas FX einzahlen &rarr;
                </a>
              )}

              <div className="p-4 rounded-xl text-xs text-zinc-500 leading-relaxed mb-6" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
                Gold Foundry hat keinen Zugriff auf dein Kapital.
              </div>

              <button
                onClick={() => goTo(3)}
                disabled={!depositAmount}
                className="gf-btn w-full"
                style={{ opacity: !depositAmount ? 0.4 : 1 }}
              >
                Weiter &rarr;
              </button>
            </div>
          )}

          {/* Step 3: Trader waehlen */}
          {step === 3 && (
            <div>
              <h2 className="gf-heading text-2xl mb-2">Waehle deine Trader</h2>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                Mindestens einen Trader aktivieren.
              </p>

              <div className="space-y-3 mb-8">
                {TRADERS.map((t) => {
                  const active = selectedTraders.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTrader(t.id)}
                      className="w-full text-left p-4 rounded-xl transition-all duration-200"
                      style={{
                        background: active ? "rgba(250,239,112,0.06)" : "var(--gf-panel)",
                        border: `2px solid ${active ? "var(--gf-gold)" : "var(--gf-border)"}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">{t.name}</div>
                          <div className="text-xs text-zinc-500">{t.asset}</div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <div className="text-emerald-400 font-semibold">{t.perf}</div>
                            <div className="text-zinc-600">Winrate {t.wr}</div>
                          </div>
                          {active && (
                            <span className="text-lg" style={{ color: "var(--gf-gold)" }}>&#x2713;</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleComplete}
                disabled={selectedTraders.length === 0 || saving}
                className="gf-btn gf-btn-shimmer w-full"
                style={{ opacity: selectedTraders.length === 0 ? 0.4 : 1 }}
              >
                {saving ? "Wird eingerichtet..." : "Los geht's!"}
              </button>

              <p className="text-[10px] text-zinc-600 text-center mt-4 leading-relaxed">
                Risikohinweis: Der Handel mit Forex und CFDs birgt ein hohes Risiko. Du kannst dein gesamtes Kapital verlieren.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
