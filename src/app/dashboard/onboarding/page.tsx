"use client";
import { useState } from "react";

interface SubStep {
  label: string;
  detail?: string;
  link?: string;
}

interface OnboardingStep {
  title: string;
  icon: string;
  substeps: SubStep[];
}

const STEPS: OnboardingStep[] = [
  {
    title: "MT4 installieren",
    icon: "1",
    substeps: [
      { label: "MetaTrader 4 herunterladen", link: "https://www.metatrader4.com/de/download" },
      { label: "MT4 installieren und starten" },
      { label: "Server auswaehlen", detail: "Server: Dein Broker-Server (siehe E-Mail)" },
      { label: "Login-Daten eingeben", detail: "Login: Deine Kontonummer" },
      { label: "Passwort eingeben", detail: "Passwort: Siehe Broker-E-Mail (Investor-Passwort)" },
      { label: "Verbindung pruefen", detail: "Unten rechts muss 'Verbunden' stehen" },
    ],
  },
  {
    title: "WhatsApp Gruppe beitreten",
    icon: "2",
    substeps: [
      { label: "Tritt unserer WhatsApp-Community bei", link: "https://chat.whatsapp.com/goldfoundry" },
    ],
  },
  {
    title: "Erste Trades beobachten",
    icon: "3",
    substeps: [
      { label: "Beobachte die Signale 3 Tage lang" },
      { label: "Verstehe die Signal-Struktur (BUY/SELL, SL, TP)" },
      { label: "Frage im Chat wenn du etwas nicht verstehst" },
    ],
  },
  {
    title: "Broker-Konto eroeffnen",
    icon: "4",
    substeps: [
      { label: "Tegas FX (empfohlen: 24x Hebel, 5% Trailing DD)", link: "https://tegasfx.com/?ref=goldfoundry" },
      { label: "Oder: TAG Markets (12x Hebel, 10% Fixed DD)", link: "https://tagmarkets.com/?ref=goldfoundry" },
    ],
  },
  {
    title: "Profite kassieren",
    icon: "5",
    substeps: [
      { label: "Payout-Einstellungen konfigurieren" },
      { label: "Gewinne werden automatisch berechnet" },
      { label: "Auszahlung ab 50 EUR moeglich" },
    ],
  },
  {
    title: "50% Affiliate aktivieren",
    icon: "6",
    substeps: [
      { label: "Teile deinen Affiliate-Link und verdiene bis zu 50% Provision" },
    ],
  },
];

export default function OnboardingPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<number>(0);
  const [refLink] = useState("https://goldfoundry.de/?ref=DEIN_CODE");
  const [copied, setCopied] = useState(false);

  const totalSubsteps = STEPS.reduce((sum, s) => sum + s.substeps.length, 0);
  const completedCount = completed.size;
  const progressPercent = Math.round((completedCount / totalSubsteps) * 100);

  const toggleSubstep = (key: string) => {
    const next = new Set(completed);
    next.has(key) ? next.delete(key) : next.add(key);
    setCompleted(next);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6" style={{ color: "#fff8e8" }}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Willkommen bei Gold Foundry</h1>
        <p className="text-sm opacity-60">Folge diesen Schritten um loszulegen</p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl p-5" style={{ background: "#0a0806", border: "1px solid rgba(212,165,55,0.12)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Fortschritt</span>
          <span className="text-sm font-bold" style={{ color: "#d4a537" }}>{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(212,165,55,0.1)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, background: "#d4a537" }}
          />
        </div>
        <p className="text-xs mt-2 opacity-40">{completedCount} von {totalSubsteps} Schritten erledigt</p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, si) => {
          const isExpanded = expanded === si;
          const stepKeys = step.substeps.map((_, ssi) => `${si}-${ssi}`);
          const allDone = stepKeys.every((k) => completed.has(k));

          return (
            <div
              key={si}
              className="rounded-xl overflow-hidden"
              style={{ background: "#0a0806", border: `1px solid ${allDone ? "rgba(39,174,96,0.3)" : "rgba(212,165,55,0.12)"}` }}
            >
              {/* Step header */}
              <button
                onClick={() => setExpanded(isExpanded ? -1 : si)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: allDone ? "rgba(39,174,96,0.15)" : "rgba(212,165,55,0.12)",
                    color: allDone ? "#27ae60" : "#d4a537",
                  }}
                >
                  {allDone ? "\u2713" : step.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{step.title}</div>
                  <div className="text-xs opacity-40">
                    {stepKeys.filter((k) => completed.has(k)).length} / {step.substeps.length} erledigt
                  </div>
                </div>
                <span className="text-xs opacity-40">{isExpanded ? "\u25B2" : "\u25BC"}</span>
              </button>

              {/* Substeps */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {step.substeps.map((sub, ssi) => {
                    const key = `${si}-${ssi}`;
                    const done = completed.has(key);
                    return (
                      <div key={ssi}>
                        <label
                          className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
                          style={{
                            background: done ? "rgba(39,174,96,0.05)" : "#111",
                            border: `1px solid ${done ? "rgba(39,174,96,0.15)" : "rgba(212,165,55,0.06)"}`,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggleSubstep(key)}
                            className="mt-0.5 accent-yellow-600"
                          />
                          <div className="flex-1">
                            <div className={`text-sm ${done ? "line-through opacity-50" : ""}`}>
                              {sub.label}
                            </div>
                            {sub.detail && (
                              <div className="text-xs mt-1 font-mono" style={{ color: "#d4a537", opacity: 0.7 }}>
                                {sub.detail}
                              </div>
                            )}
                            {sub.link && (
                              <a
                                href={sub.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs mt-1 inline-block underline"
                                style={{ color: "#d4a537" }}
                              >
                                Link oeffnen
                              </a>
                            )}
                          </div>
                        </label>

                        {/* Special: Affiliate link copy for last step */}
                        {si === 5 && ssi === 0 && (
                          <div className="mt-2 flex gap-2">
                            <input
                              readOnly
                              value={refLink}
                              className="flex-1 px-3 py-2 rounded-lg text-xs font-mono"
                              style={{ background: "#111", border: "1px solid rgba(212,165,55,0.15)", color: "#d4a537" }}
                            />
                            <button
                              onClick={copyLink}
                              className="px-4 py-2 rounded-lg text-xs font-semibold"
                              style={{ background: "#d4a537", color: "#040302" }}
                            >
                              {copied ? "Kopiert!" : "Kopieren"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {progressPercent === 100 && (
        <div className="rounded-xl p-6 text-center" style={{ background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.2)" }}>
          <div className="text-2xl mb-2">Glueckwunsch!</div>
          <p className="text-sm" style={{ color: "#27ae60" }}>
            Du hast alle Schritte abgeschlossen. Viel Erfolg beim Trading!
          </p>
        </div>
      )}

      {/* Risk disclaimer */}
      <p className="text-[10px] text-center opacity-30 mt-8">
        Risikohinweis: Vergangene Performance ist kein verlaesslicher Indikator fuer zukuenftige Ergebnisse.
        Trading birgt erhebliche Verlustrisiken. Gold Foundry ist kein Broker und bietet keine Anlageberatung.
      </p>
    </div>
  );
}
