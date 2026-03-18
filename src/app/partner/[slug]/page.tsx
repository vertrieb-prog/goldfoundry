import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return {
    title: `Partner — Gold Foundry`,
    description: `Werde Teil des Gold Foundry Partner-Netzwerks. Kopiere Top-Trader und verdiene mit.`,
  };
}

async function getPartner(slug: string) {
  // TODO: Load from Supabase by slug
  return {
    name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    bio: "Erfahrener Trader und Gold Foundry Partner mit nachgewiesener Performance.",
    tier: "Gold Partner",
    customers: 47,
    totalProfit: 12480,
    traders: [
      { name: "TraderX", winRate: 78, profit: "+14.2%" },
      { name: "AlphaGold", winRate: 82, profit: "+19.7%" },
    ],
  };
}

export default async function PartnerPage({ params }: { params: { slug: string } }) {
  const partner = await getPartner(params.slug);

  return (
    <main className="min-h-screen bg-[#060503] text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="text-[#d4a537] text-sm font-semibold uppercase tracking-wider">{partner.tier}</span>
          <h1 className="text-4xl font-bold mt-2 mb-4">{partner.name}</h1>
          <p className="text-gray-400 max-w-xl mx-auto">{partner.bio}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-[#d4a537]">{partner.customers}</p>
            <p className="text-gray-400 text-sm mt-1">Aktive Kunden</p>
          </div>
          <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-[#d4a537]">{partner.totalProfit.toLocaleString("de-DE")} €</p>
            <p className="text-gray-400 text-sm mt-1">Gesamtgewinn Kunden</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Empfohlene Trader</h2>
        <div className="space-y-4 mb-12">
          {partner.traders.map((t) => (
            <div key={t.name} className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-5 flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">{t.name}</p>
                <p className="text-gray-400 text-sm">Win-Rate: {t.winRate}%</p>
              </div>
              <span className="text-[#d4a537] font-bold text-xl">{t.profit}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href={`/auth/register?ref=${params.slug}`}
            className="inline-block bg-[#d4a537] text-black font-bold px-8 py-4 rounded-xl hover:bg-[#e6b84a] transition"
          >
            Jetzt starten
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
