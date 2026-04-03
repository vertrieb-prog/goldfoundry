"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Card3D from "@/components/ui/Card3D";
import HoloPanel from "@/components/ui/HoloPanel";

type Step = 1 | 2 | 3 | 4;
type Experience = "beginner" | "intermediate" | "pro" | null;
type Capital = 250 | 500 | 1000 | 5000 | null;
type Risk = "8x" | "12x" | "24x" | null;

const RISK_PROFILES: Record<string, { label: string; dd: string; ddType: string; monthly: string; color: string; icon: string; desc: string }> = {
  "8x": { label: "Konservativ", dd: "20%", ddType: "Fix", monthly: "8-15%", color: "#22c55e", icon: "🛡️", desc: "Großer Puffer, ideal für den Einstieg" },
  "12x": { label: "Balanced", dd: "10%", ddType: "Trailing", monthly: "12-25%", color: "#d4a537", icon: "⚖️", desc: "Bester Kompromiss aus Rendite und Sicherheit" },
  "24x": { label: "Aggressiv", dd: "5%", ddType: "Fix", monthly: "20-40%", color: "#f97316", icon: "🚀", desc: "Maximale Rendite, enges DD-Limit" },
};

function getRecommendation(exp: Experience, cap: Capital): "8x" | "12x" | "24x" {
  if (exp === "beginner") return "8x";
  if (exp === "pro" && cap && cap >= 1000) return "24x";
  return "12x";
}

export default function CTASection() {
  const [step, setStep] = useState<Step>(1);
  const [experience, setExperience] = useState<Experience>(null);
  const [capital, setCapital] = useState<Capital>(null);
  const [risk, setRisk] = useState<Risk>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const recommendation = getRecommendation(experience, capital);

  function goStep(s: Step) { setStep(s); }

  function selectExperience(e: Experience) { setExperience(e); setTimeout(() => goStep(2), 300); }
  function selectCapital(c: Capital) { setCapital(c); setTimeout(() => goStep(3), 300); }
  function selectRisk(r: Risk) { setRisk(r); setTimeout(() => goStep(4), 300); }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: crypto.randomUUID().slice(0, 12), meta: { experience, capital, risk } }),
      });
      if (res.ok) { setStatus("success"); window.location.href = "/dashboard"; }
      else { setStatus("error"); }
    } catch { setStatus("error"); }
  }

  const cardStyle = (selected: boolean, color?: string) => ({
    background: selected ? `rgba(212,165,55,0.06)` : "rgba(10,8,6,0.7)",
    border: `2px solid ${selected ? (color || "rgba(212,165,55,0.4)") : "rgba(212,165,55,0.08)"}`,
    borderRadius: 14,
    padding: "16px 20px",
    cursor: "pointer" as const,
    transition: "all 0.2s",
    textAlign: "left" as const,
    width: "100%",
  });

  const progressPct = ((step - 1) / 3) * 100;

  return (
    <>
      <section id="register" style={{ padding: "80px 20px", maxWidth: 600, margin: "0 auto" }}>
        <Card3D intensity={8}>
        <HoloPanel>
        <div className="gf-glass-strong" style={{ borderRadius: 24, padding: "40px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#d4a537", marginBottom: 8, fontWeight: 600 }}>
            In 30 Sekunden startklar
          </div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
            Dein <span style={{ color: "#d4a537" }}>Setup in 30 Sekunden</span>
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: 14 }}>3 Fragen — dann startet PHANTOM.</p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            {["Erfahrung", "Kapital", "Risiko", "Start"].map((label, i) => (
              <span key={label} style={{ fontSize: 10, color: step > i ? "#d4a537" : "#52525b", fontWeight: step === i + 1 ? 700 : 400, transition: "all 0.3s" }}>{label}</span>
            ))}
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(212,165,55,0.1)", overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ height: "100%", background: "linear-gradient(90deg, #d4a537, #f0d060)", borderRadius: 2, boxShadow: "0 0 12px rgba(212, 165, 55, 0.4), 0 0 4px rgba(212, 165, 55, 0.6)" }}
            />
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Experience */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <p style={{ color: "#fafafa", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Wie viel Trading-Erfahrung hast du?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {([
                  { id: "beginner" as const, label: "Anfänger", desc: "Noch nie getradet oder erst wenige Wochen", icon: "🌱" },
                  { id: "intermediate" as const, label: "Fortgeschritten", desc: "1-2 Jahre Erfahrung, kenne die Basics", icon: "📊" },
                  { id: "pro" as const, label: "Profi", desc: "3+ Jahre, eigene Strategien, Prop Firm Erfahrung", icon: "🏆" },
                ]).map((opt) => (
                  <button key={opt.id} onClick={() => selectExperience(opt.id)} style={cardStyle(experience === opt.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 24 }}>{opt.icon}</span>
                      <div>
                        <div style={{ color: "#fafafa", fontWeight: 600, fontSize: 14 }}>{opt.label}</div>
                        <div style={{ color: "#6d6045", fontSize: 12 }}>{opt.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Capital */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <p style={{ color: "#fafafa", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Wie viel Kapital möchtest du einsetzen?</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([250, 500, 1000, 5000] as const).map((amt) => (
                  <button key={amt} onClick={() => selectCapital(amt)} style={{ ...cardStyle(capital === amt), textAlign: "center" as const, padding: "20px 16px" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#fafafa", fontFamily: "'JetBrains Mono', monospace" }}>
                      {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </div>
                    <div style={{ fontSize: 12, color: "#6d6045", marginTop: 2 }}>Euro</div>
                  </button>
                ))}
              </div>
              <button onClick={() => goStep(1)} style={{ marginTop: 12, background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer" }}>
                &larr; Zurück
              </button>
            </motion.div>
          )}

          {/* STEP 3: Risk Profile */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <p style={{ color: "#fafafa", fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Welches Risikoprofil passt zu dir?</p>
              <p style={{ color: "#6d6045", fontSize: 12, marginBottom: 16 }}>Unsere Empfehlung: <span style={{ color: "#d4a537", fontWeight: 700 }}>{recommendation} {RISK_PROFILES[recommendation].label}</span></p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(["8x", "12x", "24x"] as const).map((r) => {
                  const p = RISK_PROFILES[r];
                  const isRec = r === recommendation;
                  return (
                    <button key={r} onClick={() => selectRisk(r)} style={{ ...cardStyle(risk === r, p.color), position: "relative" as const }}>
                      {isRec && <span style={{ position: "absolute", top: -8, right: 12, background: "#d4a537", color: "#040302", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>EMPFOHLEN</span>}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{p.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#fafafa", fontWeight: 700, fontSize: 15 }}>{r} Hebel</span>
                            <span style={{ color: p.color, fontWeight: 600, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{p.monthly}/Mo</span>
                          </div>
                          <div style={{ color: "#6d6045", fontSize: 11, marginTop: 2 }}>{p.dd} {p.ddType} DD &middot; {p.desc}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => goStep(2)} style={{ marginTop: 12, background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer" }}>
                &larr; Zurück
              </button>
            </motion.div>
          )}

          {/* STEP 4: Result + Register */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              {/* Result Card */}
              <div style={{ background: "rgba(212,165,55,0.04)", border: "2px solid rgba(212,165,55,0.2)", borderRadius: 16, padding: 24, marginBottom: 24, textAlign: "center" }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#d4a537", marginBottom: 8 }}>Dein Setup</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", marginBottom: 4 }}>PHANTOM Gold &middot; {risk}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#6d6045" }}>Kapital</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fafafa", fontFamily: "'JetBrains Mono', monospace" }}>{capital && capital >= 1000 ? `${capital / 1000}k` : capital}&euro;</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#6d6045" }}>Effektiv</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#d4a537", fontFamily: "'JetBrains Mono', monospace" }}>{capital && risk ? `${(capital * parseInt(risk)).toLocaleString("de-DE")}&euro;` : "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#6d6045" }}>Max DD</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fafafa", fontFamily: "'JetBrains Mono', monospace" }}>{risk ? RISK_PROFILES[risk].dd : "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#6d6045" }}>Rendite</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e", fontFamily: "'JetBrains Mono', monospace" }}>{risk ? RISK_PROFILES[risk].monthly : "-"}/Mo</div>
                  </div>
                </div>
              </div>

              {/* Register Form */}
              {status === "success" ? (
                <div style={{ color: "#22c55e", fontSize: 16, fontWeight: 600, padding: 32, textAlign: "center" }}>Weiterleitung zum Dashboard...</div>
              ) : (
                <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required
                    style={{ background: "rgba(10,8,6,0.7)", border: "1px solid rgba(212,165,55,0.15)", borderRadius: 10, padding: "14px 16px", color: "#fafafa", fontSize: 15, outline: "none", width: "100%" }} />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    style={{ background: "rgba(10,8,6,0.7)", border: "1px solid rgba(212,165,55,0.15)", borderRadius: 10, padding: "14px 16px", color: "#fafafa", fontSize: 15, outline: "none", width: "100%" }} />
                  <button type="submit" disabled={status === "loading"} className="gf-btn gf-btn-shimmer" style={{ padding: "16px 24px", fontSize: 16, width: "100%", marginTop: 4 }}>
                    {status === "loading" ? "Wird eingerichtet..." : "Jetzt kostenlos starten"}
                  </button>
                  {status === "error" && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}>Fehler. Versuche es erneut.</p>}
                </form>
              )}

              <button onClick={() => goStep(3)} style={{ marginTop: 12, background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer", display: "block", margin: "12px auto 0" }}>
                &larr; Zurück
              </button>
              <p style={{ textAlign: "center", color: "#52525b", fontSize: 10, marginTop: 12, lineHeight: 1.5 }}>
                100% kostenlos. Kein Abo. Gold Foundry vermittelt nur die Technologie.
                Rendite-Angaben basieren auf historischer Performance und sind keine Garantie.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        </div>{/* end glass container */}
        </HoloPanel>
        </Card3D>
      </section>

      <footer style={{ padding: "24px 20px", textAlign: "center", borderTop: "1px solid rgba(212,165,55,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 12 }}>
          <Link href="/impressum" style={{ color: "#52525b", fontSize: 12 }}>Impressum</Link>
          <Link href="/datenschutz" style={{ color: "#52525b", fontSize: 12 }}>Datenschutz</Link>
          <Link href="/risikohinweis" style={{ color: "#52525b", fontSize: 12 }}>Risikohinweis</Link>
          <Link href="/agb" style={{ color: "#52525b", fontSize: 12 }}>AGB</Link>
        </div>
        <p style={{ color: "#52525b", fontSize: 11 }}>&copy; 2026 PhoenixOne AI UG (haftungsbeschraenkt)</p>
      </footer>
    </>
  );
}
