import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — Exchange Vergleich | Gold Foundry`,
    description: `${name} im Detail: Gebühren, Features und Gold Foundry Integration. Jetzt vergleichen.`,
  };
}

async function getExchange(slug: string) {
  // TODO: Load from config or Supabase
  return {
    name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "Eine der führenden Krypto-Börsen mit umfangreichen Trading-Funktionen.",
    makerFee: "0.10%",
    takerFee: "0.10%",
    features: ["Spot Trading", "Futures", "Copy Trading", "API-Zugang", "Staking"],
    integrationBenefits: [
      "Automatisches Copy Trading via Gold Foundry Smart Copier",
      "Risiko-Management durch Risk Shield",
      "FORGE Points für jede Transaktion",
      "Echtzeit-Performance-Tracking",
    ],
  };
}

export default async function ExchangePage({ params }: { params: { slug: string } }) {
  const exchange = await getExchange(params.slug);

  return (
    <main className="min-h-screen bg-[#060503] text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">{exchange.name}</h1>
        <p className="text-gray-400 mb-12 max-w-2xl">{exchange.description}</p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Gebühren</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Maker Fee</span>
                <span className="text-[#d4a537] font-semibold">{exchange.makerFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Taker Fee</span>
                <span className="text-[#d4a537] font-semibold">{exchange.takerFee}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Features</h2>
            <ul className="space-y-2">
              {exchange.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-gray-300">
                  <span className="text-[#d4a537]">&#10003;</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 mb-12">
          <h2 className="text-xl font-bold mb-4">Gold Foundry Integration</h2>
          <ul className="space-y-3">
            {exchange.integrationBenefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-gray-300">
                <span className="text-[#d4a537] mt-0.5">&#9670;</span> {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center">
          <Link
            href="/auth/register"
            className="inline-block bg-[#d4a537] text-black font-bold px-8 py-4 rounded-xl hover:bg-[#e6b84a] transition"
          >
            Jetzt mit {exchange.name} starten
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
