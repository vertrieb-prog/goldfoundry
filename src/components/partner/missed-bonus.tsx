"use client";

import Link from "next/link";

interface MissedBonusProps {
  missedFP: number;
  reason: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function MissedBonus({
  missedFP,
  reason,
  actionLabel = "Jetzt nachholen",
  actionHref = "/dashboard/partner",
}: MissedBonusProps) {
  const euroValue = (missedFP * 0.1).toLocaleString("de-DE", { minimumFractionDigits: 2 });

  return (
    <div className="bg-[#0a0a08] border border-red-900/40 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 shrink-0 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 text-lg">
          !
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">
            Du hast {missedFP.toLocaleString("de-DE")} FP verpasst
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Das entspricht {euroValue} € &middot; {reason}
          </p>
          <Link
            href={actionHref}
            className="mt-3 inline-block text-[#d4a537] text-sm font-semibold hover:underline"
          >
            {actionLabel} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
