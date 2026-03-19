"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4;

const EXPERIENCES = [
  { id: "beginner", label: "Anf\u00e4nger", desc: "Ich starte gerade erst mit Trading", icon: "\ud83c\udf31" },
  { id: "intermediate", label: "Fortgeschritten", desc: "Ich trade seit einiger Zeit", icon: "\u26a1" },
  { id: "advanced", label: "Profi", desc: "Trading ist mein Beruf", icon: "\ud83d\udc8e" },
];

const GOALS = [
  { id: "prop_firm", label: "Prop Firm", desc: "Fremdkapital traden (FTMO, Tegas, etc.)", icon: "\ud83c\udfe6" },
  { id: "live", label: "Live Trading", desc: "Eigenes Kapital mit Copier handeln", icon: "\ud83d\udcb0" },
  { id: "crypto", label: "Crypto", desc: "Krypto-Trading & DeFi", icon: "\u20bf" },
  { id: "learning", label: "Lernen", desc: "Erstmal verstehen wie alles funktioniert", icon: "\ud83d\udcda" },
];

const PLANS = [
  {
    id: "free", name: "Free", price: "\u20ac0", desc: "Dashboard + FORGE Mentor testen",
    features: ["Dashboard Zugang", "FORGE Mentor (3 Fragen/Tag)", "Market \u00dcbersicht"],
    cta: "Kostenlos starten",
  },
  {
    id: "copier", name: "Smart Copier", price: "\u20ac6", priceNote: "im 1. Monat (statt \u20ac29)",
    desc: "Automatisches Trading mit Risk Shield",
    features: ["Alles aus Free", "Smart Copier Zugang", "3 Trading-Konten", "7-Faktor Risk Shield", "Telegram Signale"],
    cta: "Copier aktivieren", recommended: true,
  },
  {
    id: "pro", name: "Pro", price: "\u20ac16", priceNote: "im 1. Monat (statt \u20ac79)",
    desc: "Unbegrenzt + Prop-Firm Modus + Partner",
    features: ["Alles aus Copier", "Unbegrenzte Konten", "Prop-Firm Modus", "1:1 Support", "Partner Dashboard"],
    cta: "Pro starten",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [saving, setSaving] = useState(false);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const router = useRouter();

  const goTo = useCallback((target: Step) => {
    if (animating) return;
    setAnimDir(target > step ? "forward" : "back");
    setAnimating(true);
    setTimeout(() => { setStep(target); setAnimating(false); }, 250);
  }, [step, animating]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience, goal, plan: selectedPlan, completed: true }),
      });
    } catch { /* continue anyway */ }
    router.push("/dashboard");
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gf-obsidian)" }}>
      {/* Background */}
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 600, height: 600, top: "10%", left: "50%", transform: "translateX(-50%)" }} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Progress */}
        <div className="w-full max-w-lg mb-8">
          <div className="flex items-center justify-between mb-3">
            {step > 1 && (
              <button
                onClick={() => goTo((step - 1) as Step)}
                className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>&larr;</span> Zur\u00fcck
              </button>
            )}
            <span className="text-xs text-zinc-600 font-mono ml-auto">Schritt {step} / 4</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--gf-border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: "var(--gf-gold)" }}
            />
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
          {step === 1 && <StepWelcome onNext={() => goTo(2)} />}
          {step === 2 && (
            <StepProfile
              experience={experience}
              setExperience={setExperience}
              goal={goal}
              setGoal={setGoal}
              onNext={() => goTo(3)}
            />
          )}
          {step === 3 && (
            <StepPlan
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onNext={() => goTo(4)}
            />
          )}
          {step === 4 && (
            <StepFirstSteps
              experience={experience}
              goal={goal}
              plan={selectedPlan}
              saving={saving}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Step 1: Willkommen ──────────────────────────────────── */
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-6" style={{ animation: "float 3s ease-in-out infinite" }}>
        \u2692\ufe0f
      </div>
      <h1 className="gf-heading text-3xl md:text-4xl mb-4">
        Willkommen bei<br />
        <span className="gf-gold-text">Gold Foundry</span>
      </h1>
      <p className="text-zinc-400 text-base leading-relaxed mb-8 max-w-md mx-auto">
        In 2 Minuten richten wir alles f\u00fcr dich ein. Dein Trading l\u00e4uft danach auf Autopilot.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { icon: "\u26a1", title: "Smart Copier", desc: "Trades automatisch kopieren" },
          { icon: "\ud83d\udee1\ufe0f", title: "Risk Shield", desc: "7-Faktor Schutz" },
          { icon: "\ud83e\udd16", title: "FORGE Mentor", desc: "Dein KI-Berater" },
        ].map((f) => (
          <div key={f.title} className="gf-panel p-4 text-center hover:transform-none">
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="text-xs font-semibold text-white mb-1">{f.title}</div>
            <div className="text-[10px] text-zinc-500">{f.desc}</div>
          </div>
        ))}
      </div>

      <button onClick={onNext} className="gf-btn gf-btn-shimmer gf-btn-breathe w-full">
        Los geht&apos;s &rarr;
      </button>
    </div>
  );
}

/* ── Step 2: Trading-Profil ──────────────────────────────── */
function StepProfile({
  experience, setExperience, goal, setGoal, onNext,
}: {
  experience: string; setExperience: (v: string) => void;
  goal: string; setGoal: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="mb-8">
        <div className="gf-eyebrow mb-3">\u25c6 Dein Profil</div>
        <h2 className="gf-heading text-2xl mb-2">Erz\u00e4hl uns von dir.</h2>
        <p className="text-sm text-zinc-500">Damit wir Gold Foundry auf dich anpassen k\u00f6nnen.</p>
      </div>

      {/* Experience */}
      <div className="mb-8">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">
          Trading-Erfahrung
        </label>
        <div className="space-y-2">
          {EXPERIENCES.map((e) => (
            <button
              key={e.id}
              onClick={() => setExperience(e.id)}
              className="w-full text-left p-4 rounded-xl transition-all duration-200"
              style={{
                background: experience === e.id ? "rgba(250,239,112,0.06)" : "var(--gf-panel)",
                border: `2px solid ${experience === e.id ? "rgba(250,239,112,0.3)" : "var(--gf-border)"}`,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{e.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{e.label}</div>
                  <div className="text-xs text-zinc-500">{e.desc}</div>
                </div>
                {experience === e.id && (
                  <span className="ml-auto text-[var(--gf-gold)] text-lg">\u2713</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="mb-8">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">
          Was ist dein Ziel?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              className="text-left p-4 rounded-xl transition-all duration-200"
              style={{
                background: goal === g.id ? "rgba(250,239,112,0.06)" : "var(--gf-panel)",
                border: `2px solid ${goal === g.id ? "rgba(250,239,112,0.3)" : "var(--gf-border)"}`,
              }}
            >
              <div className="text-xl mb-2">{g.icon}</div>
              <div className="text-sm font-semibold text-white mb-0.5">{g.label}</div>
              <div className="text-[10px] text-zinc-500 leading-tight">{g.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!experience || !goal}
        className="gf-btn w-full"
        style={{ opacity: !experience || !goal ? 0.4 : 1 }}
      >
        Weiter &rarr;
      </button>
    </div>
  );
}

/* ── Step 3: Plan w\u00e4hlen ──────────────────────────────── */
function StepPlan({
  selectedPlan, setSelectedPlan, onNext,
}: {
  selectedPlan: string; setSelectedPlan: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="mb-8">
        <div className="gf-eyebrow mb-3">\u25c6 Dein Plan</div>
        <h2 className="gf-heading text-2xl mb-2">W\u00e4hle deinen Start.</h2>
        <p className="text-sm text-zinc-500">Du kannst jederzeit upgraden oder downgraden.</p>
      </div>

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className="w-full text-left rounded-2xl transition-all duration-200 relative overflow-hidden"
            style={{
              background: selectedPlan === plan.id ? "rgba(250,239,112,0.04)" : "var(--gf-panel)",
              border: `2px solid ${selectedPlan === plan.id ? "rgba(250,239,112,0.3)" : "var(--gf-border)"}`,
              padding: "20px",
            }}
          >
            {plan.recommended && (
              <div
                className="absolute top-0 right-0 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg"
                style={{ background: "var(--gf-gold)", color: "var(--gf-obsidian)", letterSpacing: "1px" }}
              >
                Empfohlen
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-base font-bold text-white">{plan.name}</div>
                <div className="text-xs text-zinc-500">{plan.desc}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold" style={{ color: "var(--gf-gold)" }}>{plan.price}</div>
                {plan.priceNote && <div className="text-[10px] text-zinc-500">{plan.priceNote}</div>}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span style={{ color: "var(--gf-gold)", fontSize: 10 }}>\u2713</span>
                  {f}
                </div>
              ))}
            </div>

            {selectedPlan === plan.id && (
              <div
                className="absolute left-0 top-4 bottom-4 w-1 rounded-r"
                style={{ background: "var(--gf-gold)" }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <button onClick={onNext} className="gf-btn w-full">
          {selectedPlan === "free" ? "Kostenlos starten \u2192" : `${PLANS.find(p => p.id === selectedPlan)?.cta} \u2192`}
        </button>
      </div>

      <p className="text-[10px] text-zinc-600 text-center mt-4 leading-relaxed">
        Risikohinweis: Der Handel mit Forex und CFDs birgt ein hohes Risiko.
        Du kannst dein gesamtes Kapital verlieren.
      </p>
    </div>
  );
}

/* ── Step 4: Erste Schritte ──────────────────────────────── */
function StepFirstSteps({
  experience, goal, plan, saving, onComplete,
}: {
  experience: string; goal: string; plan: string;
  saving: boolean; onComplete: () => void;
}) {
  const steps = getPersonalizedSteps(experience, goal, plan);

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="text-5xl mb-4">\ud83d\ude80</div>
        <h2 className="gf-heading text-2xl mb-2">Dein pers\u00f6nlicher Plan</h2>
        <p className="text-sm text-zinc-500">Basierend auf deinem Profil &mdash; hier sind deine n\u00e4chsten Schritte.</p>
      </div>

      <div className="space-y-3 mb-8">
        {steps.map((s, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-xl"
            style={{
              background: "var(--gf-panel)",
              border: "1px solid var(--gf-border)",
              animation: `fadeIn 0.5s ease-out ${i * 0.1}s both`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono"
              style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.15)" }}
            >
              {i + 1}
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-0.5">{s.title}</div>
              <div className="text-xs text-zinc-500 leading-relaxed">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        disabled={saving}
        className="gf-btn gf-btn-shimmer w-full"
      >
        {saving ? "Wird eingerichtet..." : "Zum Dashboard \u2192"}
      </button>
    </div>
  );
}

function getPersonalizedSteps(experience: string, goal: string, plan: string) {
  const steps: { title: string; desc: string }[] = [];

  if (plan !== "free") {
    steps.push({
      title: "Broker-Konto verbinden",
      desc: "Verbinde dein MT4/MT5 Konto im Dashboard unter 'Accounts'. Du brauchst nur dein Investor-Passwort.",
    });
  }

  if (goal === "prop_firm") {
    steps.push({
      title: "Prop-Firm Profil einrichten",
      desc: "W\u00e4hle dein Firm-Profil (Tegas 24x oder Tag 12x) damit der Risk Shield die Regeln kennt.",
    });
  }

  if (plan !== "free") {
    steps.push({
      title: "Smart Copier aktivieren",
      desc: "Ein Klick im Copier-Dashboard startet das automatische Trading. Der Risk Shield sch\u00fctzt ab Tag 1.",
    });
  }

  steps.push({
    title: "FORGE Mentor kennenlernen",
    desc: "Dein KI-Trading-Mentor beantwortet Fragen zu Strategie, Risiko und Marktlage. Klick auf das Chat-Icon.",
  });

  if (experience === "beginner") {
    steps.push({
      title: "Trading-Basics lernen",
      desc: "Schau dir unsere Wissens-Sektion an. FORGE Mentor erkl\u00e4rt dir alles Schritt f\u00fcr Schritt.",
    });
  }

  steps.push({
    title: "WhatsApp Community beitreten",
    desc: "Tritt unserer Community bei f\u00fcr Support, Updates und Austausch mit anderen Tradern.",
  });

  if (plan !== "free") {
    steps.push({
      title: "Partner-Link teilen",
      desc: "Verdiene bis zu 50% Provision auf jede Empfehlung. Deinen Link findest du im Partner-Dashboard.",
    });
  }

  return steps;
}
