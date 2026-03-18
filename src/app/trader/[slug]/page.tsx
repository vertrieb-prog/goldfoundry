import { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — Trader Profil | Gold Foundry`,
    description: `Trading-Statistiken und Performance von ${name}. Jetzt kopieren mit dem Gold Foundry Smart Copier.`,
  };
}

async function getTrader(slug: string) {
  // TODO: Load from Supabase
  return {
    name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    strategy: "Intraday-Scalping auf XAUUSD mit engem Risikomanagement. Fokus auf London- und NY-Session.",
    winRate: 79,
    avgProfit: "+2.1%",
    monthlyReturn: "+14.3%",
    maxDrawdown: "-4.8%",
    totalTrades: 1243,
    copiers: 89,
  };
}

export default async function TraderPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ref?: string };
}) {
  const trader = await getTrader(params.slug);

  // Set 90-day ref cookie if ref parameter exists
  if (searchParams.ref) {
    const cookieStore = cookies();
    // Cookie is set via middleware or client-side; placeholder logic
  }

  const stats = [
    { label: "Win-Rate", value: `${trader.winRate}%` },
    { label: "Ø Gewinn/Trade", value: trader.avgProfit },
    { label: "Monatsrendite", value: trader.monthlyReturn },
    { label: "Max. Drawdown", value: trader.maxDrawdown },
    { label: "Trades gesamt", value: trader.totalTrades.toLocaleString("de-DE") },
    { label: "Aktive Kopierer", value: trader.copiers.toString() },
  ];

  return (
    <main className="min-h-screen bg-[#060503] text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-2">{trader.name}</h1>
        <p className="text-[#d4a537] font-semibold mb-8">Verifizierter Trader</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#d4a537]">{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">Performance-Chart</h2>
          <div className="h-48 flex items-center justify-center border border-[#1a1a15] rounded-lg text-gray-500">
            Chart-Platzhalter — wird nach Integration geladen
          </div>
        </div>

        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 mb-12">
          <h2 className="text-xl font-bold mb-3">Strategie</h2>
          <p className="text-gray-300 leading-relaxed">{trader.strategy}</p>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-block bg-[#d4a537] text-black font-bold px-8 py-4 rounded-xl hover:bg-[#e6b84a] transition"
          >
            Diesen Trader kopieren
          </Link>
        </div>

        <p className="mt-16 text-xs text-gray-600 text-center leading-relaxed">
          Risikohinweis: Der Handel mit Finanzinstrumenten birgt erhebliche Risiken und kann zum Verlust des
          eingesetzten Kapitals führen. Vergangene Ergebnisse sind keine Garantie für zukünftige Performance.
        </p>
      </div>
    </main>
  );
}
