"use client";

interface PerformanceCardProps {
  customerCount: number;
  totalProfit: number;
  partnerName: string;
}

export default function PerformanceCard({ customerCount, totalProfit, partnerName }: PerformanceCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-[#d4a537] via-[#b8912e] to-[#8a6c22]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
      <div className="relative">
        <p className="text-black/60 text-sm font-medium mb-1">{partnerName}</p>
        <p className="text-black text-2xl font-bold leading-tight">
          Meine {customerCount} Kunden haben
        </p>
        <p className="text-black text-3xl font-extrabold mt-1">
          {totalProfit.toLocaleString("de-DE")} EUR verdient
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="bg-black/20 text-black text-xs font-semibold px-3 py-1 rounded-full">
            Gold Foundry Partner
          </span>
        </div>
      </div>
    </div>
  );
}
