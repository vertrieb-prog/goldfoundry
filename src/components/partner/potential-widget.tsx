"use client";

import Link from "next/link";

interface PotentialWidgetProps {
  currentTier: string;
  nextTier: string;
  currentMonthly: number;
  potentialMonthly: number;
}

export default function PotentialWidget({
  currentTier,
  nextTier,
  currentMonthly,
  potentialMonthly,
}: PotentialWidgetProps) {
  const diff = potentialMonthly - currentMonthly;

  return (
    <div className="bg-[#0a0a08] border border-[#d4a537]/30 rounded-xl p-6">
      <p className="text-[#d4a537] text-sm font-semibold uppercase tracking-wider mb-3">Upgrade-Potenzial</p>
      <h3 className="text-xl font-bold text-white mb-1">
        Als {nextTier} verdienst du
      </h3>
      <p className="text-3xl font-extrabold text-[#d4a537]">
        {diff.toLocaleString("de-DE")} € mehr pro Monat
      </p>
      <div className="mt-4 flex items-center gap-4 text-sm">
        <div>
          <p className="text-gray-500">Aktuell ({currentTier})</p>
          <p className="text-gray-300 font-semibold">{currentMonthly.toLocaleString("de-DE")} €/Monat</p>
        </div>
        <div className="text-[#d4a537] text-lg">&rarr;</div>
        <div>
          <p className="text-gray-500">{nextTier}</p>
          <p className="text-[#d4a537] font-semibold">{potentialMonthly.toLocaleString("de-DE")} €/Monat</p>
        </div>
      </div>
      <Link
        href="/dashboard/partner"
        className="mt-5 inline-block bg-[#d4a537] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#e6b84a] transition"
      >
        Jetzt upgraden
      </Link>
    </div>
  );
}
