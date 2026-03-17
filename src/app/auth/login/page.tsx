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
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
    const data = await res.json();
    if (data.error) { setErr(data.error); setLoading(false); } else router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gf-obsidian)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-2xl font-bold gf-gold-text">GOLD FOUNDRY</span></Link>
          <div className="text-[9px] tracking-[3px] mt-1" style={{ color: "var(--gf-text-dim)" }}>FORGE TERMINAL</div>
        </div>
        <div className="gf-panel p-8">
          <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--gf-text-bright)" }}>Login</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" placeholder="E-Mail" className="gf-input" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Passwort" className="gf-input" value={pw} onChange={e => setPw(e.target.value)} required />
            {err && <div className="text-sm" style={{ color: "var(--gf-red)" }}>{err}</div>}
            <button type="submit" className="gf-btn w-full" disabled={loading}>{loading ? "Laden..." : "Einloggen →"}</button>
          </form>
          <div className="mt-6 text-center text-sm" style={{ color: "var(--gf-text-dim)" }}>
            Kein Account? <Link href="/auth/register" style={{ color: "var(--gf-gold)" }}>Registrieren</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
