"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function UpgradeBanner() {
  const [tier, setTier] = useState<string>("free");
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        const t = d.user?.subscription_tier || "free";
        setTier(t);
        if (t === "free") setShow(true);
      })
      .catch(() => setShow(true));
  }, []);

  if (!show) return null;

  return (
    <div
      className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(212,165,55,0.12), rgba(212,165,55,0.04))",
        border: "1px solid rgba(212,165,55,0.2)",
      }}
    >
      <div>
        <div className="text-sm font-semibold text-white">
          Schalte alle Features frei
        </div>
        <div className="text-xs text-zinc-400 mt-0.5">
          Smart Copier, FORGE Mentor, Strategy Lab und mehr — ab €9/Mo
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href="/pricing"
          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: "var(--gf-gold)",
            color: "#000",
          }}
        >
          Pläne ansehen →
        </Link>
        <Link
          href="/smart-copier"
          className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Mehr erfahren
        </Link>
      </div>
    </div>
  );
}
