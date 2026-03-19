"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
      const data = await res.json();
      if (data.error) { setErr(data.error); setLoading(false); } else router.push("/dashboard");
    } catch (e) { setErr("Verbindungsfehler — bitte versuche es erneut"); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--gf-obsidian)" }}>
      {/* Background */}
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 500, height: 500, top: "20%", left: "30%" }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-extrabold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
          </Link>
          <div className="text-[9px] tracking-[3px] mt-1.5 text-zinc-600 font-mono">FORGE TERMINAL</div>
        </div>

        {/* Card */}
        <div className="gf-panel p-8">
          <h2 className="text-xl font-bold text-white mb-2">Willkommen zurück</h2>
          <p className="text-sm text-zinc-500 mb-6">Melde dich in deinem Account an.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">E-Mail</label>
              <input type="email" placeholder="name@email.com" className="gf-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Passwort</label>
              <input type="password" placeholder="••••••••" className="gf-input" value={pw} onChange={e => setPw(e.target.value)} required />
            </div>
            {err && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">{err}</div>}
            <button type="submit" className="gf-btn w-full mt-2" disabled={loading}>
              {loading ? "Laden..." : "Einloggen →"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth/forgot-password" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Passwort vergessen?</Link>
          </div>
          <div className="mt-4 text-center text-sm text-zinc-500">
            Kein Account?{" "}
            <Link href="/auth/register" className="text-[var(--gf-gold)] hover:underline font-medium">Registrieren</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
