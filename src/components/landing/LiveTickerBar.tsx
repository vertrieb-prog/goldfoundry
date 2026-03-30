"use client";

const tickerItems = [
  { symbol: "XAUUSD", result: "+1.4R" },
  { symbol: "US500", result: "+0.8R" },
  { symbol: "DAX40", result: "+1.1R" },
  { symbol: "EURUSD", result: "+0.6R" },
  { symbol: "GBPJPY", result: "+0.9R" },
  { symbol: "NAS100", result: "+1.2R" },
];

function TickerContent() {
  return (
    <>
      {tickerItems.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap">
          <span style={{ color: "var(--gf-text-bright)" }}>{item.symbol}</span>
          <span style={{ color: "#22c55e" }}>{item.result}</span>
          <span style={{ color: "var(--gf-gold)" }}>&#10003;</span>
          {i < tickerItems.length - 1 && (
            <span className="mx-4" style={{ color: "var(--gf-text-dim)" }}>&middot;</span>
          )}
        </span>
      ))}
    </>
  );
}

export default function LiveTickerBar() {
  return (
    <div
      className="gf-mask-sides overflow-hidden py-3"
      style={{
        background: "var(--gf-dark)",
        borderTop: "1px solid var(--gf-border)",
        borderBottom: "1px solid var(--gf-border)",
      }}
    >
      <div className="gf-marquee-track text-sm font-mono">
        <TickerContent />
        {/* Duplicate for seamless loop */}
        <TickerContent />
      </div>
    </div>
  );
}
