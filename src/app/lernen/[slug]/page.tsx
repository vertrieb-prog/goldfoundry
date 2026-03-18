import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${title} — Lernen | Gold Foundry`,
    description: `Lerne ${title} — Trading-Wissen von Gold Foundry.`,
  };
}

const sidebarLinks = [
  { label: "Trading Grundlagen", slug: "trading-grundlagen" },
  { label: "Risikomanagement", slug: "risikomanagement" },
  { label: "Technische Analyse", slug: "technische-analyse" },
  { label: "Smart Copier Guide", slug: "smart-copier-guide" },
  { label: "FORGE Points", slug: "forge-points" },
  { label: "Partner werden", slug: "partner-werden" },
];

async function getArticle(slug: string) {
  // TODO: Load from Supabase or CMS
  return {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    updatedAt: "2026-03-15",
    sections: [
      {
        heading: "Einführung",
        content:
          "In diesem Artikel lernst du die wichtigsten Konzepte kennen, die du für erfolgreiches Trading brauchst. Gold Foundry stellt dir alle Werkzeuge zur Verfügung.",
      },
      {
        heading: "Kernpunkte",
        content:
          "Verstehe die Grundlagen, bevor du mit echtem Kapital tradest. Nutze den FORGE Mentor für personalisierte Lernpfade und den Risk Shield für automatisches Risikomanagement.",
      },
      {
        heading: "Nächste Schritte",
        content:
          "Erstelle dein dein Gold Foundry Konto und starte mit dem Demo-Modus. Der Smart Copier ermöglicht dir, von erfahrenen Tradern zu lernen.",
      },
    ],
  };
}

export default async function LernenPage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  return (
    <main className="min-h-screen bg-[#060503] text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 flex gap-8">
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="sticky top-8 space-y-1">
            <p className="text-[#d4a537] font-semibold text-sm uppercase mb-3">Lernen</p>
            {sidebarLinks.map((l) => (
              <Link
                key={l.slug}
                href={`/lernen/${l.slug}`}
                className={`block text-sm py-2 px-3 rounded-lg transition ${
                  l.slug === params.slug
                    ? "bg-[#d4a537]/10 text-[#d4a537]"
                    : "text-gray-400 hover:text-white hover:bg-[#0a0a08]"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
          <p className="text-gray-500 text-sm mb-10">Aktualisiert: {article.updatedAt}</p>

          {article.sections.map((s) => (
            <section key={s.heading} className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-[#d4a537]">{s.heading}</h2>
              <p className="text-gray-300 leading-relaxed">{s.content}</p>
            </section>
          ))}

          <div className="mt-12 bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 text-center">
            <p className="text-lg font-semibold mb-3">Bereit loszulegen?</p>
            <Link
              href="/auth/register"
              className="inline-block bg-[#d4a537] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#e6b84a] transition"
            >
              Jetzt registrieren
            </Link>
          </div>

          <p className="mt-12 text-xs text-gray-600 leading-relaxed">
            Risikohinweis: Der Handel mit Finanzinstrumenten birgt erhebliche Risiken und kann zum Verlust
            des eingesetzten Kapitals führen. Vergangene Ergebnisse sind keine Garantie für zukünftige Performance.
          </p>
        </article>
      </div>
    </main>
  );
}
