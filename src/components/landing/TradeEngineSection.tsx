"use client";

const steps = [
  {
    num: "01",
    title: "ENTRY",
    desc: "Signal erkannt. Entry berechnet. Order platziert.",
    icon: "⊕",
  },
  {
    num: "02",
    title: "DCA",
    desc: "Kurs gegen dich? Smart DCA kauft guenstiger nach.",
    icon: "⇣+",
  },
  {
    num: "03",
    title: "RECOVERY",
    desc: "Zone Recovery aktiviert. Gegenorder sichert ab.",
    icon: "⟳",
  },
  {
    num: "04",
    title: "TRAILING",
    desc: "Im Gewinn? ATR-Trail sichert Profits automatisch.",
    icon: "↗",
  },
  {
    num: "05",
    title: "KILL SWITCH",
    desc: "Max Drawdown erreicht? Alles wird sofort geschlossen.",
    icon: "⛊",
  },
];

export default function TradeEngineSection() {
  return (
    <section id="engine" className="relative overflow-hidden">
      <div className="gf-section">
        {/* Header */}
        <div className="text-center mb-16 animate-in">
          <span className="gf-eyebrow mb-4 block">KI ENGINE</span>
          <h2 className="gf-heading text-3xl md:text-5xl mb-4">
            Trade Management Engine
          </h2>
          <p style={{ color: "var(--gf-text-muted)" }} className="text-lg max-w-xl mx-auto">
            13 Strategien. 9 Safety Features. Vollautomatisch.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connecting line — desktop horizontal */}
          <div
            className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px -translate-y-1/2 z-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--gf-gold-dim), transparent)",
            }}
          />
          {/* Connecting line — mobile vertical */}
          <div
            className="md:hidden absolute top-[5%] bottom-[5%] left-1/2 w-px -translate-x-1/2 z-0"
            style={{
              background:
                "linear-gradient(180deg, transparent, var(--gf-gold-dim), transparent)",
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-3 relative z-10">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`gf-panel p-6 text-center animate-in delay-${i + 1}`}
              >
                {/* Icon */}
                <div className="gf-icon-ring mx-auto mb-4 text-2xl">
                  {step.icon}
                </div>

                {/* Step number */}
                <div
                  className="font-mono text-3xl font-bold mb-2"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gf-gold-light), var(--gf-gold))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {step.num}
                </div>

                {/* Title */}
                <h3
                  className="font-bold text-sm tracking-wider mb-2"
                  style={{ color: "var(--gf-text-bright)" }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--gf-text-muted)" }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
