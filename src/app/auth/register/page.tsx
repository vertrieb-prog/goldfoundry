"use client";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const ref = params.get("ref") ?? "";

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pw, fullName: name, referralCode: ref }) });
    const data = await res.json();
    if (data.error) { setErr(data.error); setLoading(false); } else router.push("/pricing");
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Name</label>
        <input type="text" placeholder="Vollständiger Name" className="gf-input" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">E-Mail</label>
        <input type="email" placeholder="name@email.com" className="gf-input" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Passwort</label>
        <input type="password" placeholder="Min. 8 Zeichen" className="gf-input" value={pw} onChange={e => setPw(e.target.value)} minLength={8} required />
      </div>
      {ref && (
        <div className="text-xs px-3 py-2 rounded-lg bg-[rgba(250,239,112,0.04)] border border-[rgba(250,239,112,0.1)] text-[var(--gf-gold)] font-mono">
          Eingeladen von: {ref}
        </div>
      )}
      {err && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">{err}</div>}
      <button type="submit" className="gf-btn w-full mt-2" disabled={loading}>
        {loading ? "Laden..." : "Account erstellen →"}
      </button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--gf-obsidian)" }}>
      {/* Background */}
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 500, height: 500, top: "20%", right: "20%" }} />

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
          <h2 className="text-xl font-bold text-white mb-2">Account erstellen</h2>
          <p className="text-sm text-zinc-500 mb-6">Starte in unter 2 Minuten.</p>
          <Suspense><RegisterForm /></Suspense>

          <div className="mt-6 text-center text-sm text-zinc-500">
            Bereits registriert?{" "}
            <Link href="/auth/login" className="text-[var(--gf-gold)] hover:underline font-medium">Login</Link>
          </div>
        </div>

        <p className="text-center text-xs mt-4 text-zinc-600">
          Mit der Registrierung akzeptierst du unsere{" "}
          <Link href="/agb" className="underline hover:text-zinc-400">AGB</Link> und{" "}
          <Link href="/datenschutz" className="underline hover:text-zinc-400">Datenschutzrichtlinie</Link>.
        </p>
      </div>
    </div>
  );
}
