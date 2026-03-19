"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setErr("Passwort muss mindestens 8 Zeichen haben."); return; }
    if (pw !== pw2) { setErr("Passw\u00f6rter stimmen nicht \u00fcberein."); return; }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.error) setErr(data.error);
      else setDone(true);
    } catch {
      setErr("Fehler beim Zur\u00fccksetzen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-extrabold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
          </Link>
        </div>
        <div className="gf-panel p-8">
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-4">{"\u2705"}</div>
              <h2 className="text-xl font-bold text-white mb-2">Passwort ge&auml;ndert!</h2>
              <p className="text-sm text-zinc-500 mb-6">Du kannst dich jetzt mit deinem neuen Passwort einloggen.</p>
              <Link href="/auth/login" className="gf-btn w-full text-center block">Zum Login &rarr;</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Neues Passwort</h2>
              <p className="text-sm text-zinc-500 mb-6">W&auml;hle ein neues Passwort f&uuml;r deinen Account.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="password" placeholder="Neues Passwort (min. 8 Zeichen)" className="gf-input" value={pw} onChange={e => setPw(e.target.value)} minLength={8} required />
                <input type="password" placeholder="Passwort best&auml;tigen" className="gf-input" value={pw2} onChange={e => setPw2(e.target.value)} required />
                {err && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">{err}</div>}
                <button type="submit" className="gf-btn w-full" disabled={loading}>{loading ? "Wird gespeichert..." : "Passwort \u00e4ndern \u2192"}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
