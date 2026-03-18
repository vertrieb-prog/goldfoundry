import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { trader: string } }): Promise<Metadata> {
  const name = params.trader.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — Crypto Trader | Gold Foundry`,
    description: `${name} Krypto-Trading Performance. Strategie, Statistiken und Copy Trading bei Gold Foundry.`,
  };
}

async function getCryptoTrader(slug: string) {
  // TODO: Load from Supabase
  return {
    name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    exchange: "Binance",
    strategy: "Swing-Trading auf BTC, ETH und ausgewählte Altcoins. Fokus auf Trendfolge mit striktem Risikomanagement.",
    stats: [
      { label: "Monatsrendite", value: "+22.4%" },
      { label: "Win-Rate", value: "74%" },
      { label: "Max. Drawdown", value: "-6.2%" },
      { label: "Trades/Monat", value: "38" },
      { label: "Kopierer", value: "213" },
      { label: "Seit", value: "Mai 2025" },
    ],
  };
}

export default async function CryptoTraderPage({ params }: { params: { trader: string } }) {
  const trader = await getCryptoTrader(params.trader);

  return (
    <main className="min-h-screen bg-[#060503] text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/crypto" className="text-[#d4a537] text-sm hover:underline mb-6 inline-block">
          &larr; Alle Crypto-Trader
        </Link>

        <h1 className="text-4xl font-bold mb-2">{trader.name}</h1>
        <p className="text-gray-400 mb-8">Handelt auf {trader.exchange}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {trader.stats.map((s) => (
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
          Risikohinweis: Der Handel mit Kryptowährungen birgt erhebliche Risiken und kann zum Verlust des
          eingesetzten Kapitals führen. Vergangene Ergebnisse sind keine Garantie für zukünftige Performance.
        </p>
      </div>
    </main>
  );
}
