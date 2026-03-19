"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResent(true);
      setResendCooldown(60);
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--gf-obsidian)" }}>
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
        <div className="gf-panel p-8 text-center">
          {/* Animated Email Icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center" style={{
            background: "rgba(250,239,112,0.06)",
            border: "2px solid rgba(250,239,112,0.15)",
            animation: "float 3s ease-in-out infinite",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--gf-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13 2 4" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Check deine E-Mail</h2>
          <p className="text-sm text-zinc-500 mb-2 leading-relaxed">
            Wir haben dir eine Best&auml;tigungsmail gesendet.
          </p>
          {email && (
            <p className="text-sm text-zinc-400 mb-6 font-mono bg-zinc-900/50 rounded-lg px-3 py-2 inline-block">
              {email}
            </p>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-left px-2">
              <span className="text-[var(--gf-gold)] mt-0.5 text-lg">1</span>
              <span className="text-sm text-zinc-400">&Ouml;ffne dein E-Mail-Postfach</span>
            </div>
            <div className="flex items-start gap-3 text-left px-2">
              <span className="text-[var(--gf-gold)] mt-0.5 text-lg">2</span>
              <span className="text-sm text-zinc-400">Klicke den Best&auml;tigungslink</span>
            </div>
            <div className="flex items-start gap-3 text-left px-2">
              <span className="text-[var(--gf-gold)] mt-0.5 text-lg">3</span>
              <span className="text-sm text-zinc-400">Du wirst automatisch weitergeleitet</span>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 mb-3">
              Keine E-Mail erhalten? Pr&uuml;fe auch den Spam-Ordner.
            </p>
            {resendCooldown > 0 ? (
              <p className="text-xs text-zinc-600 font-mono">
                Erneut senden in {resendCooldown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--gf-gold)", background: "none", border: "none", cursor: "pointer" }}
              >
                {resending ? "Wird gesendet..." : resent ? "Erneut gesendet!" : "E-Mail erneut senden"}
              </button>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/auth/login" className="text-[var(--gf-gold)] hover:underline font-medium">
              &larr; Zur&uuml;ck zum Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
