"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Step = 1 | 2 | 3 | 4;
type Risk = "8x" | "12x" | "24x" | null;

const MONO = "'JetBrains Mono', monospace";

const PROFILES: Record<string, { label: string; dd: string; ddType: string; monthlyLow: number; monthlyHigh: number; color: string; desc: string }> = {
  "8x": { label: "Konservativ", dd: "20%", ddType: "Fix", monthlyLow: 0.08, monthlyHigh: 0.15, color: "#22c55e", desc: "Grosser DD-Puffer, optimiert auf Stabilitaet" },
  "12x": { label: "Balanced", dd: "10%", ddType: "Trailing", monthlyLow: 0.12, monthlyHigh: 0.25, color: "#d4a537", desc: "Bester Kompromiss — empfohlen von PHANTOM" },
  "24x": { label: "Aggressiv", dd: "5%", ddType: "Fix", monthlyLow: 0.20, monthlyHigh: 0.40, color: "#f97316", desc: "Maximale Rendite, enges DD-Limit" },
};

interface LiveData {
  totalGain: number;
  totalMonthly: number;
  totalEquity: number;
  totalProfit: number;
  totalDrawdown: number;
  totalDaily: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  liveData?: LiveData | null;
}

export default function FunnelOverlay({ open, onClose, liveData }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [capital, setCapital] = useState(1000);
  const [risk, setRisk] = useState<Risk>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Live performance metrics
  const monthlyPct = liveData?.totalMonthly ?? 28;
  const totalGain = liveData?.totalGain ?? 28;
  const maxDd = liveData?.totalDrawdown ?? 6.76;
  const dailyPct = liveData?.totalDaily ?? 8;

  function handleClose() {
    setStep(1); setRisk(null); setName(""); setEmail(""); setStatus("idle");
    onClose();
  }

  function selectRisk(r: Risk) {
    setRisk(r);
    setTimeout(() => setStep(3), 250);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: crypto.randomUUID().slice(0, 12), meta: { capital, risk } }),
      });
      if (res.ok) { setStatus("success"); window.location.href = "/dashboard"; }
      else { setStatus("error"); }
    } catch { setStatus("error"); }
  }

  // Projection based on selected risk profile + real performance
  const profile = risk ? PROFILES[risk] : null;
  const avgMonthly = profile ? (profile.monthlyLow + profile.monthlyHigh) / 2 : 0;
  const proj1m = Math.round(capital * avgMonthly);
  const proj3m = Math.round(capital * Math.pow(1 + avgMonthly, 3) - capital);
  const proj12m = Math.round(capital * Math.pow(1 + avgMonthly, 12) - capital);

  const inputStyle = {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: "16px 20px", color: "#fafafa", fontSize: 16, outline: "none", width: "100%",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(4,3,2,0.94)", backdropFilter: "blur(32px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, overflow: "auto",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25 }}
            style={{ width: "100%", maxWidth: 620, position: "relative" }}
          >
            {/* Close */}
            <button onClick={handleClose} style={{
              position: "absolute", top: -48, right: 0, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 40, height: 40,
              cursor: "pointer", color: "#8a7a5a", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
            }}>&times;</button>

            {/* Live Performance Banner */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 28, padding: "14px 0", marginBottom: 24,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              {[
                { label: "Live Gain", value: `+${totalGain.toFixed(1)}%`, color: "#22c55e" },
                { label: "Monatlich", value: `${monthlyPct.toFixed(1)}%`, color: "#22c55e" },
                { label: "Max DD", value: `${maxDd.toFixed(2)}%`, color: "#ef4444" },
                { label: "Daily", value: `${dailyPct.toFixed(1)}%`, color: "#e0d4b8" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: MONO, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* ═══ STEP 1: Capital ═══ */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
                  <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 6 }}>Dein Startkapital</h2>
                    <p style={{ color: "#8a7a5a", fontSize: 14 }}>Wie viel moechtest du von PHANTOM verwalten lassen?</p>
                  </div>

                  {/* Capital Display */}
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 48, fontWeight: 800, fontFamily: MONO, color: "#d4a537" }}>
                      {capital.toLocaleString("de-DE")}<span style={{ fontSize: 24, color: "#8a7a5a" }}>&euro;</span>
                    </div>
                  </div>

                  {/* Slider */}
                  <div style={{ padding: "0 8px", marginBottom: 8 }}>
                    <input
                      type="range" min={250} max={25000} step={250} value={capital}
                      onChange={(e) => setCapital(+e.target.value)}
                      style={{ width: "100%", accentColor: "#d4a537", height: 6 }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#52525b", marginTop: 4 }}>
                      <span>250&euro;</span><span>25.000&euro;</span>
                    </div>
                  </div>

                  {/* Quick Select */}
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "20px 0 32px", flexWrap: "wrap" }}>
                    {[500, 1000, 2500, 5000, 10000].map((amt) => (
                      <button key={amt} onClick={() => setCapital(amt)} style={{
                        padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: MONO, cursor: "pointer",
                        background: capital === amt ? "rgba(212,165,55,0.1)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${capital === amt ? "rgba(212,165,55,0.3)" : "rgba(255,255,255,0.06)"}`,
                        color: capital === amt ? "#d4a537" : "#8a7a5a",
                      }}>{amt >= 1000 ? `${amt / 1000}k` : amt}&euro;</button>
                    ))}
                  </div>

                  {/* Live preview */}
                  <div style={{
                    background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)",
                    borderRadius: 12, padding: "16px 20px", marginBottom: 24,
                  }}>
                    <div style={{ fontSize: 11, color: "#6d6045", marginBottom: 8 }}>Basierend auf aktueller Live-Performance ({monthlyPct.toFixed(1)}%/Monat):</div>
                    <div style={{ display: "flex", justifyContent: "space-around" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#6d6045", textTransform: "uppercase" }}>1 Monat</div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO, color: "#22c55e" }}>+{Math.round(capital * monthlyPct / 100).toLocaleString("de-DE")}&euro;</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#6d6045", textTransform: "uppercase" }}>6 Monate</div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO, color: "#22c55e" }}>+{Math.round(capital * (Math.pow(1 + monthlyPct / 100, 6) - 1)).toLocaleString("de-DE")}&euro;</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#6d6045", textTransform: "uppercase" }}>12 Monate</div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO, color: "#d4a537" }}>+{Math.round(capital * (Math.pow(1 + monthlyPct / 100, 12) - 1)).toLocaleString("de-DE")}&euro;</div>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setStep(2)} className="gf-btn gf-btn-shimmer" style={{ width: "100%", padding: "16px", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>
                    Weiter — Risikoprofil waehlen
                  </button>

                  <p style={{ textAlign: "center", color: "#52525b", fontSize: 9, marginTop: 12 }}>
                    Prognose basiert auf historischer Performance. Keine Garantie fuer zukuenftige Ergebnisse.
                  </p>
                </motion.div>
              )}

              {/* ═══ STEP 2: Risk Profile ═══ */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 6 }}>Dein Risikoprofil</h2>
                    <p style={{ color: "#8a7a5a", fontSize: 14 }}>Mehr Hebel = mehr Rendite, aber strikteres Drawdown-Limit</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(["8x", "12x", "24x"] as const).map((r) => {
                      const p = PROFILES[r];
                      const isRec = r === "12x";
                      const monthlyProj = Math.round(capital * (p.monthlyLow + p.monthlyHigh) / 2);
                      const yearlyProj = Math.round(capital * (Math.pow(1 + (p.monthlyLow + p.monthlyHigh) / 2, 12) - 1));
                      return (
                        <button key={r} onClick={() => selectRisk(r)} style={{
                          background: risk === r ? "rgba(212,165,55,0.06)" : "rgba(255,255,255,0.015)",
                          border: `2px solid ${risk === r ? p.color : "rgba(255,255,255,0.05)"}`,
                          borderRadius: 14, padding: "20px 24px", cursor: "pointer", textAlign: "left" as const,
                          position: "relative" as const, transition: "all 0.15s",
                        }}>
                          {isRec && <span style={{ position: "absolute", top: -10, right: 16, background: "#d4a537", color: "#040302", fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase" }}>Empfohlen</span>}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: "#fafafa" }}>{r} <span style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.label}</span></div>
                              <div style={{ color: "#6d6045", fontSize: 12, marginTop: 4 }}>{p.dd} {p.ddType} DD &middot; {p.desc}</div>
                            </div>
                            <div style={{ textAlign: "right", minWidth: 100 }}>
                              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: MONO, color: "#22c55e" }}>+{monthlyProj.toLocaleString("de-DE")}&euro;</div>
                              <div style={{ fontSize: 10, color: "#6d6045" }}>pro Monat</div>
                              <div style={{ fontSize: 12, fontFamily: MONO, color: "#d4a537", marginTop: 2 }}>+{yearlyProj.toLocaleString("de-DE")}&euro;/Jahr</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={() => setStep(1)} style={{ marginTop: 16, background: "none", border: "none", color: "#8a7a5a", fontSize: 13, cursor: "pointer" }}>&larr; Kapital aendern ({capital.toLocaleString("de-DE")}&euro;)</button>
                </motion.div>
              )}

              {/* ═══ STEP 3: Prognose + Ergebnis ═══ */}
              {step === 3 && profile && (
                <motion.div key="s3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 6 }}>Deine Prognose</h2>
                    <p style={{ color: "#8a7a5a", fontSize: 14 }}>Basierend auf Live-Performance von PHANTOM</p>
                  </div>

                  {/* Setup Summary */}
                  <div style={{
                    background: "rgba(212,165,55,0.03)", border: "1px solid rgba(212,165,55,0.1)",
                    borderRadius: 14, padding: 24, marginBottom: 20, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 11, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Dein PHANTOM Setup</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 4 }}>
                      {capital.toLocaleString("de-DE")}&euro; &middot; {risk} Hebel
                    </div>
                    <div style={{ fontSize: 13, color: profile.color, fontWeight: 600 }}>{profile.label} &middot; {profile.dd} {profile.ddType} DD</div>
                  </div>

                  {/* Prognose Grid */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1,
                    background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden", marginBottom: 20,
                  }}>
                    {[
                      { label: "Nach 1 Monat", value: `+${proj1m.toLocaleString("de-DE")}\u20AC`, sub: `= ${(capital + proj1m).toLocaleString("de-DE")}\u20AC`, color: "#22c55e" },
                      { label: "Nach 3 Monaten", value: `+${proj3m.toLocaleString("de-DE")}\u20AC`, sub: `= ${(capital + proj3m).toLocaleString("de-DE")}\u20AC`, color: "#22c55e" },
                      { label: "Nach 12 Monaten", value: `+${proj12m.toLocaleString("de-DE")}\u20AC`, sub: `= ${(capital + proj12m).toLocaleString("de-DE")}\u20AC`, color: "#d4a537" },
                    ].map((p) => (
                      <div key={p.label} style={{ background: "#0a0906", padding: "18px 12px", textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{p.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: p.color }}>{p.value}</div>
                        <div style={{ fontSize: 11, color: "#8a7a5a", fontFamily: MONO, marginTop: 2 }}>{p.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly Rendite Indicator */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10, padding: "12px 16px", marginBottom: 24,
                  }}>
                    <span style={{ color: "#8a7a5a", fontSize: 12 }}>Erwartete monatliche Rendite</span>
                    <span style={{ color: "#22c55e", fontSize: 16, fontWeight: 700, fontFamily: MONO }}>
                      {(profile.monthlyLow * 100).toFixed(0)}-{(profile.monthlyHigh * 100).toFixed(0)}% / Monat
                    </span>
                  </div>

                  <button onClick={() => setStep(4)} className="gf-btn gf-btn-shimmer" style={{ width: "100%", padding: "16px", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>
                    Jetzt kostenlos starten
                  </button>

                  <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
                    <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#8a7a5a", fontSize: 12, cursor: "pointer" }}>Kapital aendern</button>
                    <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#8a7a5a", fontSize: 12, cursor: "pointer" }}>Risiko aendern</button>
                  </div>

                  <p style={{ textAlign: "center", color: "#52525b", fontSize: 9, marginTop: 16, lineHeight: 1.5 }}>
                    Prognose basiert auf historischer Performance ({monthlyPct.toFixed(1)}%/Monat). Keine Garantie. Trading birgt Verlustrisiken.
                  </p>
                </motion.div>
              )}

              {/* ═══ STEP 4: Register ═══ */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 6 }}>Letzter Schritt</h2>
                    <p style={{ color: "#8a7a5a", fontSize: 14 }}>Erstelle dein kostenloses Konto — in 10 Sekunden fertig</p>
                  </div>

                  {/* Mini Summary */}
                  <div style={{
                    display: "flex", justifyContent: "center", gap: 20, marginBottom: 24,
                    padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#6d6045" }}>Kapital</div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: MONO, color: "#e0d4b8" }}>{capital.toLocaleString("de-DE")}&euro;</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#6d6045" }}>Hebel</div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: MONO, color: "#d4a537" }}>{risk}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#6d6045" }}>Prognose/Monat</div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: MONO, color: "#22c55e" }}>+{proj1m.toLocaleString("de-DE")}&euro;</div>
                    </div>
                  </div>

                  {status === "success" ? (
                    <div style={{ color: "#22c55e", fontSize: 18, fontWeight: 700, padding: 40, textAlign: "center" }}>Weiterleitung zum Dashboard...</div>
                  ) : (
                    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <input type="text" placeholder="Dein Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
                      <input type="email" placeholder="Deine Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                      <button type="submit" disabled={status === "loading"} className="gf-btn gf-btn-shimmer" style={{ padding: "18px 24px", fontSize: 17, width: "100%", marginTop: 4, fontWeight: 700, cursor: "pointer" }}>
                        {status === "loading" ? "Wird eingerichtet..." : "Kostenlos starten"}
                      </button>
                      {status === "error" && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}>Fehler. Versuche es erneut.</p>}
                    </form>
                  )}

                  <button onClick={() => setStep(3)} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#8a7a5a", fontSize: 13, cursor: "pointer" }}>&larr; Zurueck zur Prognose</button>

                  <p style={{ textAlign: "center", color: "#52525b", fontSize: 10, marginTop: 16 }}>
                    100% kostenlos. Kein Abo. Gold Foundry vermittelt nur die Technologie.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <footer style={{ marginTop: 28, fontSize: 9, color: "#52525b", lineHeight: 1.5, textAlign: "center" }}>
              <strong style={{ color: "#6d6045" }}>Risikohinweis:</strong> Vergangene Performance ist kein verlaesslicher Indikator fuer zukuenftige Ergebnisse. Trading birgt erhebliche Verlustrisiken.
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
