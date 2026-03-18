"use client";

import { useEffect, useState } from "react";

export default function RecommendedByBanner() {
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)ref_partner=([^;]*)/);
    if (match) {
      setPartnerName(decodeURIComponent(match[1]));
    }
  }, []);

  if (!partnerName || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#d4a537] to-[#b8912e] text-black px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm font-semibold">
          Empfohlen von <span className="font-bold">{partnerName}</span>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-black/60 hover:text-black text-lg leading-none"
          aria-label="Schliessen"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
