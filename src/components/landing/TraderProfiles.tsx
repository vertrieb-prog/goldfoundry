"use client";

import { useEffect, useRef, useMemo } from "react";

const traders = [
  { name: "GoldForge", asset: "XAUUSD", perf: "+1.0%", wr: "72%", dd: "4.5%", since: "2022", color: "#d4a537" },
  { name: "TechForge", asset: "US500", perf: "+0.7%", wr: "68%", dd: "3.8%", since: "2023", color: "#3b82f6" },
  { name: "IndexForge", asset: "DAX40", perf: "+0.8%", wr: "65%", dd: "5.2%", since: "2023", color: "#a855f7" },
  { name: "ForexForge", asset: "EURUSD", perf: "+0.5%", wr: "74%", dd: "3.2%", since: "2022", color: "#22c55e" },
];

function generateCurve(seed: number): number[] {
  let s = seed;
  const rng = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
  return Array.from({ length: 24 }, (_, i) => 50 - rng() * 15 + i * 0.8);
}

function EquityCurve({ color, seed }: { color: string; seed: number }) {
  const points = useMemo(() => generateCurve(seed), [seed]);
  const w = 200;
  const h = 60;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });

  const polyline = coords.join(" ");
  const fillPath = `M0,${h} L${coords.map((c) => c).join(" L")} L${w},${h} Z`;
  const gradId = `grad-${seed}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[60px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function scrollToRegister(e: React.MouseEvent) {
  e.preventDefault();
  document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });
}

export default function TraderProfiles() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.classList.add("visible");
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="trader" ref={sectionRef} className="gf-section gf-reveal">
      <div className="text-center mb-16">
        <span className="gf-eyebrow mb-4 block">Unsere Trader</span>
        <h2 className="gf-heading text-3xl md:text-5xl mb-4">
          4 Profi-Trader. <span className="gf-gold-text">Verifiziert.</span>
        </h2>
        <p className="text-[var(--gf-text)] max-w-xl mx-auto text-base md:text-lg">
          Kopiere echte Trader mit echtem Track Record. Kostenlos.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 gf-stagger visible">
        {traders.map((t, i) => (
          <div key={t.name} className={`gf-panel p-4 md:p-5 flex flex-col delay-${i + 1} animate-in`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-[var(--gf-text-bright)] text-sm md:text-base">
                {t.name}
              </span>
              <span
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  color: "var(--gf-gold)",
                  borderColor: "rgba(212, 165, 55, 0.25)",
                  background: "rgba(212, 165, 55, 0.06)",
                }}
              >
                {t.asset}
              </span>
            </div>

            {/* Equity Curve */}
            <div className="mb-4 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
              <EquityCurve color={t.color} seed={(i + 1) * 7919} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-4 text-xs">
              <div>
                <span className="text-[var(--gf-text-dim)] block">&#216;/Tag</span>
                <span className="font-semibold font-mono" style={{ color: "var(--gf-gold)" }}>
                  {t.perf}
                </span>
              </div>
              <div>
                <span className="text-[var(--gf-text-dim)] block">Win Rate</span>
                <span className="font-semibold font-mono text-[var(--gf-text-bright)]">{t.wr}</span>
              </div>
              <div>
                <span className="text-[var(--gf-text-dim)] block">Max DD</span>
                <span className="font-semibold font-mono text-[var(--gf-text-bright)]">{t.dd}</span>
              </div>
              <div>
                <span className="text-[var(--gf-text-dim)] block">Seit</span>
                <span className="font-semibold font-mono text-[var(--gf-text-bright)]">{t.since}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={scrollToRegister}
              className="gf-btn gf-btn-sm text-sm py-2 px-4 w-full mt-auto"
            >
              Kostenlos kopieren
            </button>

            {/* Disclaimer */}
            <p className="text-[10px] text-[var(--gf-text-dim)] text-center mt-2 leading-tight">
              Vergangene Performance ist keine Garantie
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
