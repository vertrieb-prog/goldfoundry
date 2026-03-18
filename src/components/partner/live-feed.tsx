"use client";

interface FeedEvent {
  id: string;
  type: "referral" | "commission" | "rankup";
  message: string;
  time: string;
}

interface LiveFeedProps {
  events: FeedEvent[];
}

const typeStyles: Record<FeedEvent["type"], string> = {
  referral: "bg-blue-900/30 text-blue-400",
  commission: "bg-green-900/30 text-green-400",
  rankup: "bg-[#d4a537]/20 text-[#d4a537]",
};

const typeLabels: Record<FeedEvent["type"], string> = {
  referral: "Neuer Kunde",
  commission: "Provision",
  rankup: "Rang-Aufstieg",
};

export default function LiveFeed({ events }: LiveFeedProps) {
  if (!events.length) {
    return (
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 text-center text-gray-500 text-sm">
        Noch keine Aktivitäten. Teile deinen Ref-Link, um loszulegen.
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#1a1a15] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-semibold text-white">Live-Feed</span>
      </div>
      <div className="divide-y divide-[#1a1a15] max-h-80 overflow-y-auto">
        {events.map((e) => (
          <div key={e.id} className="px-5 py-3 flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeStyles[e.type]}`}>
              {typeLabels[e.type]}
            </span>
            <span className="text-gray-300 text-sm flex-1 min-w-0 truncate">{e.message}</span>
            <span className="text-gray-600 text-xs shrink-0">{e.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
