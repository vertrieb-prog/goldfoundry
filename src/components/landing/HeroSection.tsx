"use client";

import HeroBackground from "./HeroBackground";

const stats = [
  { value: "13", label: "Strategien" },
  { value: "9", label: "Safety" },
  { value: "24x", label: "Hebel" },
  { value: "4", label: "Trader" },
];

function scrollTo(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) {
  e.preventDefault();
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
}

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <HeroBackground />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div
          className="gf-badge mb-8"
          style={{ animation: "fadeIn 0.8s ease both" }}
        >
          100% KOSTENLOS &middot; BIS ZU 24x HEBEL &middot; REGULIERTER BROKER
        </div>

        {/* Heading */}
        <h1
          className="gf-heading text-5xl md:text-7xl mb-6"
          style={{ animation: "fadeIn 0.8s ease both 0.15s", opacity: 0 }}
        >
          Dein Trade geht rein.
          <br />
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, var(--gf-gold), var(--gf-gold-light))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Unsere KI managt ihn.
          </span>
        </h1>

        {/* Subline */}
        <p
          className="max-w-2xl mx-auto text-base md:text-lg mb-10 leading-relaxed"
          style={{
            color: "var(--gf-text)",
            animation: "fadeIn 0.8s ease both 0.3s",
            opacity: 0,
          }}
        >
          13 Strategien. 9 Safety Features. Bis zu 24x Hebel. Kopiere 4 Profi-Trader
          oder nutze die Engine auf deine eigenen Trades. Kostenlos. Fur immer.
        </p>

        {/* CTA */}
        <div style={{ animation: "fadeIn 0.8s ease both 0.45s", opacity: 0 }}>
          <a
            href="#register"
            onClick={(e) => scrollTo(e, "#register")}
            className="gf-btn gf-btn-shimmer gf-btn-breathe"
          >
            Kostenlos registrieren
          </a>
        </div>

        {/* Stats bar */}
        <div
          className="flex flex-wrap gap-8 justify-center mt-16"
          style={{ animation: "fadeIn 0.8s ease both 0.6s", opacity: 0 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span
                className="font-bold text-2xl"
                style={{ color: "var(--gf-gold)" }}
              >
                {stat.value}
              </span>
              <span
                className="text-xs mt-1"
                style={{ color: "var(--gf-text-dim)" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ animation: "float 2s ease-in-out infinite" }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gf-text-dim)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
