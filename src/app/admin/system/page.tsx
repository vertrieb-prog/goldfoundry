import { MODELS, PRICING, PARTNER_TIERS, METAAPI_COSTS } from "@/lib/config";
import { COST_MODEL } from "@/lib/ai/cached-client";

export default function AdminSystem() {
  const projections = [10, 50, 100, 500, 1000].map(n => COST_MODEL.calculate(n));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#d4a537] mb-6">System Config</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#110f0a] border border-[#2a2218] rounded p-4">
          <h2 className="text-sm font-bold text-[#d4a537] mb-3">AI Models</h2>
          <p className="text-xs text-[#a09070]">Fast: {MODELS.fast}</p>
          <p className="text-xs text-[#a09070]">Smart: {MODELS.smart}</p>
        </div>

        <div className="bg-[#110f0a] border border-[#2a2218] rounded p-4">
          <h2 className="text-sm font-bold text-[#d4a537] mb-3">Pricing</h2>
          {Object.entries(PRICING.plans).map(([k, v]) => (
            <p key={k} className="text-xs text-[#a09070]">{v.name}: €{v.price}/Mo{("profitShare" in v) ? ` (${v.profitShare}% Profit Share)` : ""}</p>
          ))}
        </div>

        <div className="bg-[#110f0a] border border-[#2a2218] rounded p-4">
          <h2 className="text-sm font-bold text-[#d4a537] mb-3">Partner Tiers</h2>
          {Object.entries(PARTNER_TIERS).map(([k, v]) => (
            <p key={k} className="text-xs text-[#a09070]">{v.name}: L1 {v.l1}%, L2 {v.l2}%, L3 {v.l3}% (min {v.minPartners} Partners)</p>
          ))}
        </div>

        <div className="bg-[#110f0a] border border-[#2a2218] rounded p-4">
          <h2 className="text-sm font-bold text-[#d4a537] mb-3">Cost Projections</h2>
          {projections.map(p => (
            <p key={p.users} className="text-xs text-[#a09070]">
              {p.users} Users: €{p.costs.total} Kosten, €{p.revenue.total} Revenue = <span className={p.profit > 0 ? "text-green-400" : "text-red-400"}>€{p.profit} Profit</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
