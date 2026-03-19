"use client";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) setErr(data.error);
      else setSent(true);
    } catch {
      setErr("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 500, height: 500, top: "20%", left: "30%" }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-extrabold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
          </Link>
          <div className="text-[9px] tracking-[3px] mt-1.5 text-zinc-600 font-mono">FORGE TERMINAL</div>
        </div>

        <div className="gf-panel p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">{"\u2709\ufe0f"}</div>
              <h2 className="text-xl font-bold text-white mb-2">Email gesendet!</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Wir haben dir einen Link zum Zur&uuml;cksetzen an <strong className="text-white">{email}</strong> geschickt.
                Pr&uuml;fe auch deinen Spam-Ordner.
              </p>
              <Link href="/auth/login" className="gf-btn w-full text-center block">Zum Login &rarr;</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Passwort vergessen?</h2>
              <p className="text-sm text-zinc-500 mb-6">Gib deine E-Mail ein und wir senden dir einen Link zum Zur&uuml;cksetzen.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">E-Mail</label>
                  <input type="email" placeholder="name@email.com" className="gf-input" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                {err && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">{err}</div>}
                <button type="submit" className="gf-btn w-full" disabled={loading}>
                  {loading ? "Wird gesendet..." : "Link senden \u2192"}
                </button>
              </form>
              <div className="mt-6 text-center text-sm text-zinc-500">
                <Link href="/auth/login" className="text-[var(--gf-gold)] hover:underline font-medium">&larr; Zum Login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
