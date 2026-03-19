"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
const TOTAL_STEPS = 7;

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

const BROKERS = [
  {
    id: "tegasfx", name: "Tegas FX", desc: "24x Hebel \u00b7 5% Trailing DD \u00b7 Ab \u20ac100",
    url: "https://tegasfx.com/?ref=goldfoundry",
    steps: ["Account auf tegasfx.com erstellen", "KYC-Verifizierung abschlie\u00dfen", "Live MT4 Konto er\u00f6ffnen", "Mindestens \u20ac100 einzahlen"],
    recommended: true,
  },
  {
    id: "tagmarkets", name: "TAG Markets", desc: "12x Amplify \u00b7 10% Fixed DD \u00b7 Niedrige Spreads",
    url: "https://tagmarkets.com/?ref=goldfoundry",
    steps: ["Account auf tagmarkets.com erstellen", "Pers\u00f6nliche Daten verifizieren", "Live MT4 Konto er\u00f6ffnen", "Hebel auf 1:500 setzen", "Konto kapitalisieren"],
  },
  {
    id: "other", name: "Anderer Broker", desc: "Jeder MT4/MT5 Broker wird unterst\u00fctzt",
    url: "",
    steps: ["Live-Konto bei deinem Broker er\u00f6ffnen", "MT4 oder MT5 Platform w\u00e4hlen", "Konto kapitalisieren"],
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("copier");
  const [copierType, setCopierType] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("");
  const [mtLogin, setMtLogin] = useState("");
  const [mtPassword, setMtPassword] = useState("");
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
        body: JSON.stringify({ experience, goal, plan: selectedPlan, copierType, broker: selectedBroker, completed: true }),
      });
      // If user entered MT credentials, try connecting
      if (mtLogin && mtPassword && selectedBroker) {
        await fetch("/api/accounts/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: mtLogin, password: mtPassword, broker: selectedBroker, platform: "mt4" }),
        }).catch(() => {});
      }
    } catch { /* continue */ }
    router.push("/dashboard");
  };

  // Free users skip steps 5-6 (copier setup)
  const handlePlanNext = () => {
    if (selectedPlan === "free") {
      goTo(7);
    } else {
      goTo(4);
    }
  };

  const handleBackFromStep = (current: Step) => {
    if (current === 7 && selectedPlan === "free") {
      goTo(3);
    } else {
      goTo((current - 1) as Step);
    }
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
              <button onClick={() => handleBackFromStep(step)} className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                <span>&larr;</span> Zur&uuml;ck
              </button>
            )}
            <span className="text-xs text-zinc-600 font-mono ml-auto">Schritt {step} / {TOTAL_STEPS}</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--gf-border)" }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: "var(--gf-gold)" }} />
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
          {step === 2 && <StepProfile experience={experience} setExperience={setExperience} goal={goal} setGoal={setGoal} onNext={() => goTo(3)} />}
          {step === 3 && <StepPlan selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} onNext={handlePlanNext} />}
          {step === 4 && <StepCopierType copierType={copierType} setCopierType={setCopierType} onNext={() => goTo(5)} />}
          {step === 5 && <StepBroker selectedBroker={selectedBroker} setSelectedBroker={setSelectedBroker} copierType={copierType} onNext={() => goTo(6)} />}
          {step === 6 && <StepConnect broker={selectedBroker} mtLogin={mtLogin} setMtLogin={setMtLogin} mtPassword={mtPassword} setMtPassword={setMtPassword} onNext={() => goTo(7)} />}
          {step === 7 && <StepDone plan={selectedPlan} copierType={copierType} saving={saving} onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
}

/* ── Step 1: Willkommen ──────────────────────────────────── */
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-6" style={{ animation: "float 3s ease-in-out infinite" }}>{"\u2692\ufe0f"}</div>
      <h1 className="gf-heading text-3xl md:text-4xl mb-4">Willkommen bei<br /><span className="gf-gold-text">Gold Foundry</span></h1>
      <p className="text-zinc-400 text-base leading-relaxed mb-8 max-w-md mx-auto">In 3 Minuten richten wir alles f&uuml;r dich ein. Dein Trading l&auml;uft danach auf Autopilot.</p>
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
      <button onClick={onNext} className="gf-btn gf-btn-shimmer gf-btn-breathe w-full">Los geht&apos;s &rarr;</button>
    </div>
  );
}

/* ── Step 2: Profil ──────────────────────────────────────── */
function StepProfile({ experience, setExperience, goal, setGoal, onNext }: { experience: string; setExperience: (v: string) => void; goal: string; setGoal: (v: string) => void; onNext: () => void }) {
  return (
    <div>
      <div className="mb-8">
        <div className="gf-eyebrow mb-3">{"\u25c6"} Dein Profil</div>
        <h2 className="gf-heading text-2xl mb-2">Erz&auml;hl uns von dir.</h2>
        <p className="text-sm text-zinc-500">Damit wir Gold Foundry auf dich anpassen k&ouml;nnen.</p>
      </div>
      <div className="mb-8">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Trading-Erfahrung</label>
        <div className="space-y-2">
          {EXPERIENCES.map((e) => (
            <button key={e.id} onClick={() => setExperience(e.id)} className="w-full text-left p-4 rounded-xl transition-all duration-200" style={{ background: experience === e.id ? "rgba(250,239,112,0.06)" : "var(--gf-panel)", border: `2px solid ${experience === e.id ? "rgba(250,239,112,0.3)" : "var(--gf-border)"}` }}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{e.icon}</span>
                <div><div className="text-sm font-semibold text-white">{e.label}</div><div className="text-xs text-zinc-500">{e.desc}</div></div>
                {experience === e.id && <span className="ml-auto text-[var(--gf-gold)] text-lg">{"\u2713"}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="mb-8">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Was ist dein Ziel?</label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => setGoal(g.id)} className="text-left p-4 rounded-xl transition-all duration-200" style={{ background: goal === g.id ? "rgba(250,239,112,0.06)" : "var(--gf-panel)", border: `2px solid ${goal === g.id ? "rgba(250,239,112,0.3)" : "var(--gf-border)"}` }}>
              <div className="text-xl mb-2">{g.icon}</div>
              <div className="text-sm font-semibold text-white mb-0.5">{g.label}</div>
              <div className="text-[10px] text-zinc-500 leading-tight">{g.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <button onClick={onNext} disabled={!experience || !goal} className="gf-btn w-full" style={{ opacity: !experience || !goal ? 0.4 : 1 }}>Weiter &rarr;</button>
    </div>
  );
}

/* ── Step 3: Plan ────────────────────────────────────────── */
function StepPlan({ selectedPlan, setSelectedPlan, onNext }: { selectedPlan: string; setSelectedPlan: (v: string) => void; onNext: () => void }) {
  return (
    <div>
      <div className="mb-8">
        <div className="gf-eyebrow mb-3">{"\u25c6"} Dein Plan</div>
        <h2 className="gf-heading text-2xl mb-2">W&auml;hle deinen Start.</h2>
        <p className="text-sm text-zinc-500">Du kannst jederzeit upgraden oder downgraden.</p>
      </div>
      <div className="space-y-3">
        {PLANS.map((plan) => (
          <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} className="w-full text-left rounded-2xl transition-all duration-200 relative overflow-hidden" style={{ background: selectedPlan === plan.id ? "rgba(250,239,112,0.04)" : "var(--gf-panel)", border: `2px solid ${selectedPlan === plan.id ? "rgba(250,239,112,0.3)" : "var(--gf-border)"}`, padding: "20px" }}>
            {plan.recommended && <div className="absolute top-0 right-0 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg" style={{ background: "var(--gf-gold)", color: "var(--gf-obsidian)", letterSpacing: "1px" }}>Empfohlen</div>}
            <div className="flex items-start justify-between mb-3">
              <div><div className="text-base font-bold text-white">{plan.name}</div><div className="text-xs text-zinc-500">{plan.desc}</div></div>
              <div className="text-right"><div className="text-xl font-bold" style={{ color: "var(--gf-gold)" }}>{plan.price}</div>{plan.priceNote && <div className="text-[10px] text-zinc-500">{plan.priceNote}</div>}</div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">{plan.features.map((f) => (<div key={f} className="flex items-center gap-1.5 text-xs text-zinc-400"><span style={{ color: "var(--gf-gold)", fontSize: 10 }}>{"\u2713"}</span>{f}</div>))}</div>
            {selectedPlan === plan.id && <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r" style={{ background: "var(--gf-gold)" }} />}
          </button>
        ))}
      </div>
      <div className="mt-6"><button onClick={onNext} className="gf-btn w-full">{selectedPlan === "free" ? "Kostenlos starten \u2192" : `${PLANS.find(p => p.id === selectedPlan)?.cta} \u2192`}</button></div>
      <p className="text-[10px] text-zinc-600 text-center mt-4 leading-relaxed">Risikohinweis: Der Handel mit Forex und CFDs birgt ein hohes Risiko. Du kannst dein gesamtes Kapital verlieren.</p>
    </div>
  );
}

/* ── Step 4: Copier-Typ wählen ───────────────────────────── */
function StepCopierType({ copierType, setCopierType, onNext }: { copierType: string; setCopierType: (v: string) => void; onNext: () => void }) {
  const types = [
    {
      id: "smart", icon: "\u26a1", name: "Smart Copier",
      desc: "Trades werden automatisch von unseren Master-Accounts kopiert. Du musst nichts tun.",
      features: ["Vollautomatisch 24/5", "7-Faktor Risk Shield", "Intelligentes Lot-Sizing", "Prop-Firm kompatibel"],
      tag: "EMPFOHLEN",
    },
    {
      id: "telegram", icon: "\ud83d\udce1", name: "Telegram Copier",
      desc: "Kopiere Signale aus Telegram-Channels automatisch auf dein MT4/MT5 Konto.",
      features: ["Eigene Channels w\u00e4hlen", "KI-Signal-Parsing", "Smart Order Management", "Scam-Detection"],
      tag: "",
    },
    {
      id: "both", icon: "\ud83d\udd25", name: "Beides",
      desc: "Nutze Smart Copier UND Telegram Copier gleichzeitig f\u00fcr maximale Flexibilit\u00e4t.",
      features: ["Alle Vorteile kombiniert", "Mehr Diversifikation", "Getrennte Risk-Limits", "Separates Konto m\u00f6glich"],
      tag: "MAXIMUM",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="gf-eyebrow mb-3">{"\u25c6"} Copier Setup</div>
        <h2 className="gf-heading text-2xl mb-2">Wie willst du traden?</h2>
        <p className="text-sm text-zinc-500">W&auml;hle deinen Copier-Typ. Du kannst sp&auml;ter wechseln.</p>
      </div>

      <div className="space-y-3">
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => setCopierType(t.id)}
            className="w-full text-left rounded-2xl transition-all duration-200 relative overflow-hidden"
            style={{
              background: copierType === t.id ? "rgba(250,239,112,0.04)" : "var(--gf-panel)",
              border: `2px solid ${copierType === t.id ? "rgba(250,239,112,0.3)" : "var(--gf-border)"}`,
              padding: "20px",
            }}
          >
            {t.tag && <div className="absolute top-0 right-0 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg" style={{ background: "var(--gf-gold)", color: "var(--gf-obsidian)", letterSpacing: "1px" }}>{t.tag}</div>}
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0 mt-1">{t.icon}</div>
              <div className="flex-1">
                <div className="text-base font-bold text-white mb-1">{t.name}</div>
                <div className="text-xs text-zinc-500 mb-3 leading-relaxed">{t.desc}</div>
                <div className="grid grid-cols-2 gap-1">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <span style={{ color: "var(--gf-gold)", fontSize: 9 }}>{"\u2713"}</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {copierType === t.id && <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r" style={{ background: "var(--gf-gold)" }} />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <button onClick={onNext} disabled={!copierType} className="gf-btn w-full" style={{ opacity: !copierType ? 0.4 : 1 }}>
          Weiter &rarr;
        </button>
      </div>
    </div>
  );
}

/* ── Step 5: Broker wählen ───────────────────────────────── */
function StepBroker({ selectedBroker, setSelectedBroker, copierType, onNext }: { selectedBroker: string; setSelectedBroker: (v: string) => void; copierType: string; onNext: () => void }) {
  const broker = BROKERS.find(b => b.id === selectedBroker);

  return (
    <div>
      <div className="mb-8">
        <div className="gf-eyebrow mb-3">{"\u25c6"} Broker</div>
        <h2 className="gf-heading text-2xl mb-2">W&auml;hle deinen Broker.</h2>
        <p className="text-sm text-zinc-500">
          {copierType === "telegram"
            ? "Dein Broker muss MT4 oder MT5 unterst\u00fctzen."
            : "Wir empfehlen Tegas FX f\u00fcr den Smart Copier."}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {BROKERS.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBroker(b.id)}
            className="w-full text-left rounded-xl transition-all duration-200 relative"
            style={{
              background: selectedBroker === b.id ? "rgba(250,239,112,0.04)" : "var(--gf-panel)",
              border: `2px solid ${selectedBroker === b.id ? "rgba(250,239,112,0.3)" : "var(--gf-border)"}`,
              padding: "16px 20px",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{b.name}</span>
                  {b.recommended && <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: "rgba(250,239,112,0.1)", color: "var(--gf-gold)" }}>Empfohlen</span>}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{b.desc}</div>
              </div>
              {selectedBroker === b.id && <span style={{ color: "var(--gf-gold)" }}>{"\u2713"}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Broker Setup Steps */}
      {broker && broker.id !== "other" && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: "var(--gf-panel)", border: "1px solid var(--gf-border)" }}>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Einrichtung {broker.name}</div>
          <div className="space-y-2.5">
            {broker.steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0" style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)" }}>{i + 1}</span>
                <span className="text-sm text-zinc-300">{s}</span>
              </div>
            ))}
          </div>
          {broker.url && (
            <a href={broker.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 text-sm font-medium" style={{ color: "var(--gf-gold)" }}>
              {broker.name} &ouml;ffnen &rarr;
            </a>
          )}
        </div>
      )}

      <button onClick={onNext} disabled={!selectedBroker} className="gf-btn w-full" style={{ opacity: !selectedBroker ? 0.4 : 1 }}>
        Weiter &rarr;
      </button>
    </div>
  );
}

/* ── Step 6: Konto verbinden ─────────────────────────────── */
function StepConnect({ broker, mtLogin, setMtLogin, mtPassword, setMtPassword, onNext }: { broker: string; mtLogin: string; setMtLogin: (v: string) => void; mtPassword: string; setMtPassword: (v: string) => void; onNext: () => void }) {
  const brokerName = BROKERS.find(b => b.id === broker)?.name ?? "Broker";

  return (
    <div>
      <div className="mb-8">
        <div className="gf-eyebrow mb-3">{"\u25c6"} Verbinden</div>
        <h2 className="gf-heading text-2xl mb-2">MetaTrader verbinden</h2>
        <p className="text-sm text-zinc-500">Gib deine {brokerName} Login-Daten ein. Wir nutzen nur Lese-Zugriff.</p>
      </div>

      {/* Security Note */}
      <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
        <span className="text-lg flex-shrink-0">{"\ud83d\udd12"}</span>
        <div>
          <div className="text-xs font-semibold text-emerald-400 mb-1">Sicher &amp; Read-Only</div>
          <div className="text-xs text-zinc-400 leading-relaxed">Wir nutzen dein <strong className="text-zinc-300">Investor-Passwort</strong> (Read-Only). Es werden keine Trades in deinem Namen ausgef&uuml;hrt ohne den Copier.</div>
        </div>
      </div>

      {/* Login Form */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Login / Kontonummer</label>
          <input
            type="text"
            value={mtLogin}
            onChange={(e) => setMtLogin(e.target.value)}
            placeholder="z.B. 12345678"
            className="gf-input"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Investor-Passwort</label>
          <input
            type="password"
            value={mtPassword}
            onChange={(e) => setMtPassword(e.target.value)}
            placeholder="Investor-Passwort (Read-Only)"
            className="gf-input"
          />
          <p className="text-[10px] text-zinc-600 mt-1.5">Findest du in MT4/MT5 unter: Datei &rarr; Kontoeinstellungen</p>
        </div>
      </div>

      <button onClick={onNext} className="gf-btn w-full">
        {mtLogin && mtPassword ? "Verbinden & Weiter \u2192" : "\u00dcberspringen \u2192"}
      </button>

      {!mtLogin && (
        <p className="text-xs text-zinc-600 text-center mt-3">
          Du kannst diesen Schritt auch sp&auml;ter im Dashboard nachholen.
        </p>
      )}
    </div>
  );
}

/* ── Step 7: Fertig ──────────────────────────────────────── */
function StepDone({ plan, copierType, saving, onComplete }: { plan: string; copierType: string; saving: boolean; onComplete: () => void }) {
  const isFree = plan === "free";

  return (
    <div className="text-center">
      <div className="text-6xl mb-6">{"\ud83c\udf89"}</div>
      <h2 className="gf-heading text-3xl mb-3">
        {isFree ? "Du bist drin!" : "Alles eingerichtet!"}
      </h2>
      <p className="text-base text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
        {isFree
          ? "Dein Free-Account ist aktiv. Erkunde das Dashboard und teste den FORGE Mentor."
          : copierType === "telegram"
            ? "Verbinde jetzt deine Telegram-Channels im Dashboard und der Copier startet automatisch."
            : "Dein Smart Copier ist bereit. Sobald sich eine Gelegenheit ergibt, wird automatisch f\u00fcr dich gehandelt."
        }
      </p>

      {/* What's next cards */}
      <div className="space-y-3 mb-8 text-left">
        {!isFree && (
          <div className="gf-panel p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>{"\u2713"}</div>
            <div>
              <div className="text-sm font-semibold text-emerald-400">Copier aktiviert</div>
              <div className="text-xs text-zinc-500">{copierType === "telegram" ? "Telegram Copier bereit" : "Smart Copier bereit"} &mdash; Risk Shield aktiv</div>
            </div>
          </div>
        )}
        <div className="gf-panel p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(250,239,112,0.08)", border: "1px solid rgba(250,239,112,0.15)" }}>{"\ud83e\udde0"}</div>
          <div>
            <div className="text-sm font-semibold text-white">FORGE Mentor</div>
            <div className="text-xs text-zinc-500">Frag deinen KI-Mentor jederzeit im Chat</div>
          </div>
        </div>
        <div className="gf-panel p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(250,239,112,0.08)", border: "1px solid rgba(250,239,112,0.15)" }}>{"\ud83d\udcb0"}</div>
          <div>
            <div className="text-sm font-semibold text-white">Partner-Programm</div>
            <div className="text-xs text-zinc-500">Verdiene bis zu 50% Provision auf jede Empfehlung</div>
          </div>
        </div>
      </div>

      <button onClick={onComplete} disabled={saving} className="gf-btn gf-btn-shimmer gf-btn-breathe w-full">
        {saving ? "Wird eingerichtet..." : "Zum Dashboard \u2192"}
      </button>
    </div>
  );
}
