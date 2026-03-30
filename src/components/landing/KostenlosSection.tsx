"use client";

import { useState } from "react";

export default function KostenlosSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const features = [
    "4 Profi-Trader kopieren",
    "13 KI-Strategien",
    "7-Faktor Risk Shield",
    "FORGE Mentor KI-Assistent",
    "Trade Journal",
    "Hebel-Rechner",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = e.target as HTMLFormElement;
      const data = new FormData(form);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          fullName: data.get("name"),
          password: crypto.randomUUID().slice(0, 12),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Registrierung fehlgeschlagen");
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="register" className="relative z-10 py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <div
          className="gf-panel p-10 md:p-16 text-center"
          style={{ borderColor: "rgba(212,165,55,0.25)", boxShadow: "0 0 80px rgba(212,165,55,0.06)" }}
        >
          {/* Eyebrow */}
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--gf-gold)" }}>
            UNSER VERSPRECHEN
          </p>

          {/* Headlines */}
          <h2 className="gf-heading text-4xl md:text-6xl mb-3">100% Kostenlos.</h2>
          <h3 className="text-xl mb-6" style={{ color: "var(--gf-text-dim)" }}>
            Keine monatlichen Gebuehren. Nie.
          </h3>

          {/* Description */}
          <p className="max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--gf-text)" }}>
            Du zahlst nur 40% deiner Gewinne — und nur wenn du im Plus bist. Kein Abo. Kein Kleingedrucktes.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto mb-12 text-left">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span style={{ color: "var(--gf-green)" }}>&#10003;</span>
                <span style={{ color: "var(--gf-text-bright)" }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Registration form */}
          {success ? (
            <div
              className="max-w-md mx-auto rounded-xl p-6"
              style={{
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
              }}
            >
              <p className="font-semibold mb-1" style={{ color: "#22c55e" }}>
                Erfolgreich registriert!
              </p>
              <p className="text-sm" style={{ color: "var(--gf-text)" }}>
                Pruefe dein E-Mail Postfach fuer den Bestaetigungslink.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="max-w-md mx-auto flex flex-col gap-3"
            >
              <input
                type="text"
                name="name"
                placeholder="Max Mustermann"
                className="gf-input"
                aria-label="Name"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="max@beispiel.de"
                className="gf-input"
                aria-label="Email"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="+49... (optional)"
                className="gf-input"
                aria-label="Telefon (optional)"
              />
              {error && (
                <div
                  className="text-sm rounded-lg px-3 py-2"
                  style={{
                    color: "#ef4444",
                    background: "rgba(239, 68, 68, 0.06)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                  }}
                >
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="gf-btn gf-btn-shimmer w-full mt-2"
                disabled={loading}
              >
                {loading ? "Registriere..." : "Kostenlos registrieren"}
              </button>
              <p className="text-xs mt-1" style={{ color: "var(--gf-text-dim)" }}>
                Tegas FX Konto wird automatisch erstellt. Mit der Registrierung stimmst du den{" "}
                <a href="/agb" className="underline hover:text-[#d4a537]">AGB</a> und dem{" "}
                <a href="/risikohinweis" className="underline hover:text-[#d4a537]">Risikohinweis</a> zu.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
