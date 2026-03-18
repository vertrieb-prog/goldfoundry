"use client";

interface MilestoneCardProps {
  title: string;
  description: string;
  achievedAt?: string;
  icon?: string;
}

export default function MilestoneCard({ title, description, achievedAt, icon = "&#9733;" }: MilestoneCardProps) {
  return (
    <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-5 flex items-start gap-4">
      <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#d4a537] to-[#8a6c22] flex items-center justify-center">
        <span className="text-black text-xl" dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-white">{title}</h3>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
        {achievedAt && (
          <p className="text-[#d4a537] text-xs mt-2 font-medium">Erreicht am {achievedAt}</p>
        )}
      </div>
    </div>
  );
}
