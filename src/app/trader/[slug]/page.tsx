import { createSupabaseAdmin } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { RISK_DISCLAIMER } from "@/lib/config";
import Image from "next/image";

export default async function TraderLandingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ref?: string };
}) {
  const db = createSupabaseAdmin();
  const slug = params.slug;
  const ref = searchParams.ref;

  // Fetch trader data
  const { data: trader, error } = await db
    .from("traders")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !trader) {
    notFound();
  }

  // Fetch partner data if ref is present
  let partner: any = null;
  if (ref) {
    const { data: p } = await db
      .from("profiles")
      .select("id, full_name, avatar_url, subscription_tier")
      .eq("username", ref)
      .single();
    partner = p;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Recommended Banner */}
        {partner && (
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-gold/50">
              {partner.avatar_url ? (
                <Image src={partner.avatar_url} alt={partner.full_name} width={48} height={48} />
              ) : (
                <div className="w-full h-full bg-gold/20 flex items-center justify-center text-gold">
                  {partner.full_name?.charAt(0) || "P"}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-gold/60 uppercase tracking-widest">Empfohlen von</p>
              <p className="text-lg font-bold">{partner.full_name}</p>
            </div>
          </div>
        )}

        {/* Trader Header */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-700">
             {trader.image_url ? (
                <Image src={trader.image_url} alt={trader.name} width={128} height={128} />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gold">🔥</div>
             )}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">{trader.name}</h1>
            <p className="text-zinc-400 text-lg">{trader.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {trader.tags?.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded uppercase tracking-tighter">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="3 Monate" value={`+${trader.performance_3m}%`} color="text-green-400" />
          <StatCard label="Win Rate" value={`${trader.win_rate}%`} />
          <StatCard label="Profit Factor" value={trader.profit_factor} />
          <StatCard label="Max Drawdown" value={`${trader.max_dd}%`} color="text-red-400" />
        </div>

        {/* Action Box */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
          <h2 className="text-2xl font-bold italic uppercase tracking-tighter">Bereit zum Kopieren?</h2>
          <p className="text-zinc-400">
            Kopiere {trader.name} automatisch auf dein Konto. Nur €6 im ersten Monat mit Code: <span className="text-gold font-mono">FORGE</span>
          </p>
          <a
            href={`/register?ref=${ref || ""}&trader=${slug}`}
            className="inline-block px-12 py-4 bg-gold text-black font-black uppercase italic tracking-tighter rounded-full hover:scale-105 transition-transform"
          >
            Jetzt Starten
          </a>
        </div>

        {/* Strategy Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold uppercase italic tracking-tighter text-zinc-500">Strategie & Risiko</h3>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 prose prose-invert max-w-none">
            {trader.strategy_details}
          </div>
        </div>

        {/* Disclaimer */}
        <footer className="pt-12 pb-8 border-t border-zinc-900 text-[10px] text-zinc-600 leading-relaxed text-center">
          {RISK_DISCLAIMER.de}
        </footer>

      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-white" }: { label: string, value: any, color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{label}</p>
      <p className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</p>
    </div>
  );
}
