"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const accepted = localStorage.getItem("gf_cookies_accepted");
    if (!accepted) {
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  function accept() {
    localStorage.setItem("gf_cookies_accepted", "true");
    setShow(false);
  }

  // Hide on sentinel pages — PHANTOM has its own layout
  if (pathname === "/sentinel" || pathname.startsWith("/sentinel/")) return null;

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[99999]" style={{ animation: "fadeIn 0.5s ease" }}>
      <div className="gf-panel p-4" style={{ border: "1px solid var(--gf-border)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
          Wir nutzen Cookies für die Funktion der Seite und zur Analyse.{" "}
          <Link href="/datenschutz" className="text-[var(--gf-gold)] hover:underline">Mehr erfahren</Link>
        </p>
        <div className="flex gap-2">
          <button onClick={accept} className="gf-btn gf-btn-sm flex-1 text-xs">Akzeptieren</button>
          <button onClick={accept} className="gf-btn-outline gf-btn-sm text-xs px-3">Nur notwendige</button>
        </div>
      </div>
    </div>
  );
}
