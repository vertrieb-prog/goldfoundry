import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${title} — Vergleich | Gold Foundry`,
    description: `Detaillierter Vergleich: ${title}. Gebühren, Features, Performance im direkten Vergleich.`,
  };
}

function parseComparison(slug: string) {
  const parts = slug.split("-vs-");
  return {
    a: parts[0]?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Gold Foundry",
    b: parts[1]?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Andere",
  };
}

const criteria = [
  { label: "Smart Copier", a: true, b: false },
  { label: "Risk Shield", a: true, b: false },
  { label: "FORGE Points", a: true, b: false },
  { label: "Partner-Programm", a: true, b: "Begrenzt" },
  { label: "Forex + Crypto", a: true, b: "Teilweise" },
  { label: "KI-Mentor", a: true, b: false },
  { label: "Deutsche Plattform", a: true, b: false },
];

export default async function VergleichPage({ params }: { params: { slug: string } }) {
  const { a, b } = parseComparison(params.slug);

  return (
    <main className="min-h-screen bg-[#060503] text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
          {a} <span className="text-[#d4a537]">vs</span> {b}
        </h1>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Ehrlicher Vergleich — Features, Kosten und Vorteile im direkten Check.
        </p>

        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl overflow-hidden mb-12">
          <div className="grid grid-cols-3 bg-[#0f0f0b] border-b border-[#1a1a15] p-4 font-semibold text-sm">
            <span>Kriterium</span>
            <span className="text-center text-[#d4a537]">{a}</span>
            <span className="text-center text-gray-400">{b}</span>
          </div>
          {criteria.map((c) => (
            <div key={c.label} className="grid grid-cols-3 p-4 border-b border-[#1a1a15] last:border-0 text-sm">
              <span className="text-gray-300">{c.label}</span>
              <span className="text-center">
                {c.a === true ? <span className="text-green-500">&#10003;</span> : String(c.a)}
              </span>
              <span className="text-center">
                {c.b === false ? (
                  <span className="text-red-500">&#10005;</span>
                ) : c.b === true ? (
                  <span className="text-green-500">&#10003;</span>
                ) : (
                  <span className="text-yellow-500">{String(c.b)}</span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-[#d4a537]/20 to-[#d4a537]/5 border border-[#d4a537]/30 rounded-xl p-6 mb-12 text-center">
          <h2 className="text-xl font-bold mb-2">Fazit</h2>
          <p className="text-gray-300 mb-4">
            {a} bietet ein vollständiges Trading-Ökosystem mit Smart Copier, Risk Shield und FORGE Points.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-[#d4a537] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#e6b84a] transition"
          >
            Gold Foundry testen
          </Link>
        </div>

        <p className="text-xs text-gray-600 text-center leading-relaxed">
          Risikohinweis: Der Handel mit Finanzinstrumenten birgt erhebliche Risiken und kann zum Verlust des
          eingesetzten Kapitals führen. Vergangene Ergebnisse sind keine Garantie für zukünftige Performance.
        </p>
      </div>
    </main>
  );
}
