"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ExitIntent() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // Only show on public pages, NEVER in dashboard/admin
  const isPublicPage = !pathname.startsWith("/dashboard") && !pathname.startsWith("/admin") && !pathname.startsWith("/auth");

  useEffect(() => {
    if (dismissed || !isPublicPage) return;
    const handler = (e: MouseEvent) => {
      if (e.clientY < 10 && !show && !dismissed) {
        setShow(true);
      }
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [show, dismissed, isPublicPage]);

  if (!show || dismissed || !isPublicPage) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="gf-panel p-8 max-w-md w-full text-center relative" style={{ border: "2px solid rgba(250,239,112,0.2)" }}>
        <button onClick={() => { setShow(false); setDismissed(true); }} className="absolute top-4 right-4 text-zinc-600 hover:text-white text-lg">&times;</button>
        <div className="text-4xl mb-4">🎁</div>
        <h2 className="text-xl font-bold text-white mb-2">Warte — nicht so schnell!</h2>
        <p className="text-sm text-zinc-400 mb-4">Teste Gold Foundry komplett kostenlos mit dem Code:</p>
        <div className="px-6 py-3 rounded-xl mb-4 text-2xl font-bold gf-gold-text tracking-[4px]" style={{ background: "rgba(250,239,112,0.06)", border: "1px solid rgba(250,239,112,0.15)" }}>
          FORGE
        </div>
        <p className="text-xs text-zinc-500 mb-6">100% Rabatt auf den ersten Monat. Kein Risiko.</p>
        <button
          onClick={() => { setShow(false); setDismissed(true); window.dispatchEvent(new Event("openFunnel")); }}
          className="gf-btn w-full text-sm"
        >
          Kostenlos starten →
        </button>
        <button onClick={() => { setShow(false); setDismissed(true); }} className="text-xs text-zinc-600 hover:text-zinc-400 mt-3 block mx-auto">
          Nein danke
        </button>
      </div>
    </div>
  );
}
