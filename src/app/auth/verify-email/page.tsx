"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") ?? "";
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(10);

  // Skip-Button nach 10 Sekunden einblenden
  useEffect(() => {
    const timer = setInterval(() => {
      setSkipCountdown(c => {
        if (c <= 1) {
          setShowSkip(true);
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(c => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Check if confirmed via URL param (user came back from email link)
  useEffect(() => {
    const confirmed = params.get("confirmed");
    if (confirmed === "true") {
      router.push("/dashboard");
    }
  }, [params, router]);

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
    } catch {}
    setResending(false);
  }

  function handleSkip() {
    router.push("/dashboard");
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

        <div className="gf-panel p-8 text-center">
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
            Wir haben dir eine Best&auml;tigungsmail mit einem Link gesendet.
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
              <span className="text-sm text-zinc-400">Klicke den <strong className="text-white">Best&auml;tigungslink</strong> in der Email</span>
            </div>
            <div className="flex items-start gap-3 text-left px-2">
              <span className="text-[var(--gf-gold)] mt-0.5 text-lg">3</span>
              <span className="text-sm text-zinc-400">Du wirst automatisch weitergeleitet</span>
            </div>
          </div>

          {/* Skip Button — erscheint nach 10 Sekunden */}
          {showSkip ? (
            <div className="mb-4" style={{ animation: "fadeIn 0.5s ease" }}>
              <button onClick={handleSkip} className="gf-btn w-full">
                Weiter zum Dashboard &rarr;
              </button>
              <p className="text-[10px] text-zinc-600 mt-2">Du kannst die Email sp&auml;ter best&auml;tigen.</p>
            </div>
          ) : (
            <div className="mb-4">
              <div className="w-full py-3 rounded-xl text-sm text-zinc-600 text-center" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                Weiter in {skipCountdown}s...
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 mb-3">
              Keine E-Mail erhalten? Pr&uuml;fe auch den Spam-Ordner.
            </p>
            {resendCooldown > 0 ? (
              <p className="text-xs text-zinc-600">
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
