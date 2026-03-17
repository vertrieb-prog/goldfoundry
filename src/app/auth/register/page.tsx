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
    if (data.error) { setErr(data.error); setLoading(false); } else router.push("/dashboard");
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      <input type="text" placeholder="Vollständiger Name" className="gf-input" value={name} onChange={e => setName(e.target.value)} required />
      <input type="email" placeholder="E-Mail" className="gf-input" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Passwort (min. 8 Zeichen)" className="gf-input" value={pw} onChange={e => setPw(e.target.value)} minLength={8} required />
      {ref && <div className="text-xs px-3 py-2 rounded" style={{ background: "rgba(212,165,55,0.05)", color: "var(--gf-gold)" }}>Eingeladen von: {ref}</div>}
      {err && <div className="text-sm" style={{ color: "var(--gf-red)" }}>{err}</div>}
      <button type="submit" className="gf-btn w-full" disabled={loading}>{loading ? "Laden..." : "Account erstellen →"}</button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gf-obsidian)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-2xl font-bold gf-gold-text">GOLD FOUNDRY</span></Link>
          <div className="text-[9px] tracking-[3px] mt-1" style={{ color: "var(--gf-text-dim)" }}>FORGE TERMINAL</div>
        </div>
        <div className="gf-panel p-8">
          <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--gf-text-bright)" }}>Account erstellen</h2>
          <Suspense><RegisterForm /></Suspense>
          <div className="mt-6 text-center text-sm" style={{ color: "var(--gf-text-dim)" }}>
            Bereits registriert? <Link href="/auth/login" style={{ color: "var(--gf-gold)" }}>Login</Link>
          </div>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "var(--gf-text-dim)" }}>
          Mit der Registrierung akzeptierst du unsere <Link href="/agb" className="underline">AGB</Link> und <Link href="/datenschutz" className="underline">Datenschutzrichtlinie</Link>.
        </p>
      </div>
    </div>
  );
}
