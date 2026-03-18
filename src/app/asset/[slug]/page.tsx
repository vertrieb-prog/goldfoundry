import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const asset = params.slug.toUpperCase();
  return {
    title: `${asset} — Asset Analyse | Gold Foundry`,
    description: `${asset} Trading: Aktuelle Analyse, Strategien und Smart Copier Integration bei Gold Foundry.`,
  };
}

async function getAsset(slug: string) {
  // TODO: Load from config or API
  return {
    symbol: slug.toUpperCase(),
    name: slug === "xauusd" ? "Gold / US Dollar" : slug.toUpperCase(),
    type: slug.includes("usd") && slug.startsWith("x") ? "Rohstoff" : "Forex",
    description: "Eines der meistgehandelten Instrumente weltweit mit hoher Liquidität und Volatilität.",
    keyFacts: [
      { label: "Spread ab", value: "0.2 Pips" },
      { label: "Hebel bis", value: "1:500" },
      { label: "Session", value: "24/5" },
      { label: "Volatilität", value: "Hoch" },
    ],
    strategies: [
      { name: "Gold Scalper Pro", return: "+12.4%/Monat", copiers: 134 },
      { name: "Trend Rider", return: "+8.7%/Monat", copiers: 89 },
    ],
  };
}

export default async function AssetPage({ params }: { params: { slug: string } }) {
  const asset = await getAsset(params.slug);

  return (
    <main className="min-h-screen bg-[#060503] text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <span className="text-[#d4a537] text-sm font-semibold uppercase">{asset.type}</span>
          <h1 className="text-4xl font-bold mt-1 mb-2">{asset.symbol}</h1>
          <p className="text-gray-400 text-lg">{asset.name}</p>
        </div>

        <p className="text-gray-300 leading-relaxed mb-8">{asset.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {asset.keyFacts.map((f) => (
            <div key={f.label} className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-[#d4a537]">{f.value}</p>
              <p className="text-gray-400 text-xs mt-1">{f.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">Aktuelle Analyse</h2>
          <div className="h-40 flex items-center justify-center border border-[#1a1a15] rounded-lg text-gray-500">
            Analyse-Platzhalter — wird durch FORGE Mentor generiert
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Passende Strategien</h2>
        <div className="space-y-4 mb-12">
          {asset.strategies.map((s) => (
            <div key={s.name} className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-5 flex justify-between items-center">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-gray-400 text-sm">{s.copiers} Kopierer</p>
              </div>
              <span className="text-[#d4a537] font-bold">{s.return}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/auth/register"
            className="inline-block bg-[#d4a537] text-black font-bold px-8 py-4 rounded-xl hover:bg-[#e6b84a] transition"
          >
            {asset.symbol} jetzt traden
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
