"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Step = 1 | 2 | 3 | 4;
type Experience = "beginner" | "intermediate" | "pro" | null;
type Risk = "8x" | "12x" | "24x" | null;

const MONO = "'JetBrains Mono', monospace";

const BROKERS = [
  {
    id: "tegasfx",
    name: "Tegas FX",
    desc: "MISA-reguliert, ECN/STP, 0 EUR Setup",
    url: "https://tegasfx.com",
    badge: "Empfohlen",
    color: "#d4a537",
    features: ["MISA License BFX2024226", "Segregierte Gelder", "ECN/STP Execution"],
  },
  {
    id: "roboforex",
    name: "RoboForex",
    desc: "FSC-reguliert, Copy Trading, niedrige Spreads",
    url: "https://roboforex.com",
    badge: null,
    color: "#3b82f6",
    features: ["FSC License 000138/437", "Copy Trading Support", "0.0 Pip Spreads"],
  },
  {
    id: "tagmarkets",
    name: "Tag Markets",
    desc: "Australisch reguliert, tiefe Liquiditaet",
    url: "https://tagmarkets.com",
    badge: null,
    color: "#8b5cf6",
    features: ["ASIC-reguliert", "Tier-1 Liquiditaet", "MetaTrader 5"],
  },
];

const RISK_PROFILES: Record<string, { label: string; dd: string; ddType: string; color: string; desc: string }> = {
  "8x": { label: "Konservativ", dd: "20%", ddType: "Fix", color: "#22c55e", desc: "Grosser DD-Puffer, ideal fuer Einsteiger" },
  "12x": { label: "Balanced", dd: "10%", ddType: "Trailing", color: "#d4a537", desc: "Bester Kompromiss — empfohlen von PHANTOM" },
  "24x": { label: "Aggressiv", dd: "5%", ddType: "Fix", color: "#f97316", desc: "Maximale Rendite, enges DD-Limit" },
};

function getRecommendation(exp: Experience): "8x" | "12x" | "24x" {
  if (exp === "beginner") return "8x";
  if (exp === "pro") return "24x";
  return "12x";
}

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
  const [experience, setExperience] = useState<Experience>(null);
  const [capital, setCapital] = useState(1000);
  const [risk, setRisk] = useState<Risk>(null);

  const totalGain = liveData?.totalGain ?? 28;
  const maxDd = liveData?.totalDrawdown ?? 6.76;

  const recommendation = getRecommendation(experience);

  function handleClose() {
    setStep(1); setExperience(null); setRisk(null);
    onClose();
  }

  function selectExperience(e: Experience) {
    setExperience(e);
    setTimeout(() => setStep(2), 250);
  }

  function selectRisk(r: Risk) {
    setRisk(r);
    setTimeout(() => setStep(4), 250);
  }

  function selectBroker(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const progressPct = ((step - 1) / 3) * 100;

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
                { label: "Max DD", value: `${maxDd.toFixed(2)}%`, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: MONO, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                {["Erfahrung", "Kapital", "Risiko", "Broker"].map((label, i) => (
                  <span key={label} style={{ fontSize: 10, color: step > i ? "#d4a537" : "#52525b", fontWeight: step === i + 1 ? 700 : 400, transition: "all 0.3s" }}>{label}</span>
                ))}
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "rgba(212,165,55,0.1)", overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ height: "100%", background: "linear-gradient(90deg, #d4a537, #f0d060)", borderRadius: 2, boxShadow: "0 0 12px rgba(212,165,55,0.4)" }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* STEP 1: Erfahrung */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 6 }}>Deine Trading-Erfahrung</h2>
                    <p style={{ color: "#8a7a5a", fontSize: 14 }}>Damit wir das richtige Risikoprofil empfehlen koennen</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {([
                      { id: "beginner" as const, label: "Anfaenger", desc: "Noch nie getradet oder erst wenige Wochen" },
                      { id: "intermediate" as const, label: "Fortgeschritten", desc: "1-2 Jahre Erfahrung, kenne die Basics" },
                      { id: "pro" as const, label: "Profi", desc: "3+ Jahre, eigene Strategien" },
                    ]).map((opt) => (
                      <button key={opt.id} onClick={() => selectExperience(opt.id)} style={{
                        background: experience === opt.id ? "rgba(212,165,55,0.06)" : "rgba(255,255,255,0.015)",
                        border: `2px solid ${experience === opt.id ? "rgba(212,165,55,0.4)" : "rgba(255,255,255,0.05)"}`,
                        borderRadius: 14, padding: "18px 24px", cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s",
                      }}>
                        <div style={{ color: "#fafafa", fontWeight: 600, fontSize: 15 }}>{opt.label}</div>
                        <div style={{ color: "#6d6045", fontSize: 12, marginTop: 2 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Kapital */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 6 }}>Dein Startkapital</h2>
                    <p style={{ color: "#8a7a5a", fontSize: 14 }}>Wie viel moechtest du von PHANTOM verwalten lassen?</p>
                  </div>

                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 48, fontWeight: 800, fontFamily: MONO, color: "#d4a537" }}>
                      {capital.toLocaleString("de-DE")}<span style={{ fontSize: 24, color: "#8a7a5a" }}>&euro;</span>
                    </div>
                  </div>

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

                  <button onClick={() => setStep(3)} className="gf-btn gf-btn-shimmer" style={{ width: "100%", padding: "16px", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>
                    Weiter — Risikoprofil waehlen
                  </button>

                  <button onClick={() => setStep(1)} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: "#8a7a5a", fontSize: 13, cursor: "pointer" }}>&larr; Erfahrung aendern</button>
                </motion.div>
              )}

              {/* STEP 3: Risikoprofil */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 6 }}>Dein Risikoprofil</h2>
                    <p style={{ color: "#8a7a5a", fontSize: 14 }}>
                      Empfehlung: <span style={{ color: "#d4a537", fontWeight: 700 }}>{recommendation} {RISK_PROFILES[recommendation].label}</span>
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(["8x", "12x", "24x"] as const).map((r) => {
                      const p = RISK_PROFILES[r];
                      const isRec = r === recommendation;
                      return (
                        <button key={r} onClick={() => selectRisk(r)} style={{
                          background: risk === r ? "rgba(212,165,55,0.06)" : "rgba(255,255,255,0.015)",
                          border: `2px solid ${risk === r ? p.color : "rgba(255,255,255,0.05)"}`,
                          borderRadius: 14, padding: "20px 24px", cursor: "pointer", textAlign: "left",
                          position: "relative", transition: "all 0.15s",
                        }}>
                          {isRec && <span style={{ position: "absolute", top: -10, right: 16, background: "#d4a537", color: "#040302", fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase" }}>Empfohlen</span>}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: "#fafafa" }}>{r} <span style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.label}</span></div>
                              <div style={{ color: "#6d6045", fontSize: 12, marginTop: 4 }}>{p.dd} {p.ddType} DD &middot; {p.desc}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={() => setStep(2)} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#8a7a5a", fontSize: 13, cursor: "pointer" }}>&larr; Kapital aendern ({capital.toLocaleString("de-DE")}&euro;)</button>
                </motion.div>
              )}

              {/* STEP 4: Broker-Auswahl + Redirect */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 6 }}>Waehle deinen Broker</h2>
                    <p style={{ color: "#8a7a5a", fontSize: 14 }}>
                      Dein Setup: {capital.toLocaleString("de-DE")}&euro; &middot; {risk} Hebel &middot; {risk ? RISK_PROFILES[risk].label : ""}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {BROKERS.map((broker) => (
                      <button key={broker.id} onClick={() => selectBroker(broker.url)} style={{
                        background: "rgba(255,255,255,0.015)",
                        border: `2px solid ${broker.badge ? "rgba(212,165,55,0.3)" : "rgba(255,255,255,0.05)"}`,
                        borderRadius: 14, padding: "20px 24px", cursor: "pointer", textAlign: "left",
                        position: "relative", transition: "all 0.15s",
                      }}>
                        {broker.badge && <span style={{ position: "absolute", top: -10, right: 16, background: "#d4a537", color: "#040302", fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase" }}>{broker.badge}</span>}
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: broker.color }}>{broker.name}</div>
                          <div style={{ color: "#6d6045", fontSize: 12, marginTop: 2 }}>{broker.desc}</div>
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {broker.features.map((f) => (
                            <span key={f} style={{ fontSize: 10, color: "#8a7a5a", background: "rgba(255,255,255,0.03)", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.04)" }}>{f}</span>
                          ))}
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, color: broker.color, fontWeight: 600 }}>Konto eroeffnen &rarr;</div>
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setStep(3)} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#8a7a5a", fontSize: 13, cursor: "pointer" }}>&larr; Risikoprofil aendern</button>

                  <p style={{ textAlign: "center", color: "#52525b", fontSize: 9, marginTop: 16, lineHeight: 1.5 }}>
                    Gold Foundry vermittelt nur die Technologie. Dein Kapital liegt beim Broker deiner Wahl. Trading birgt erhebliche Verlustrisiken.
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
