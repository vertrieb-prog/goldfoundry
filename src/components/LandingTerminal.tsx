"use client";
import { useState, useEffect, useRef } from "react";

const T = {
  bg: "#040302", bg2: "#0a0806", bg3: "#110e09",
  gold: "#d4a537", goldDk: "#9e7a1f", goldLt: "#f0d060",
  text: "#cec0a0", dim: "#6d6045", bright: "#fff6e4",
  green: "#00e6a0", red: "#ff5045", blue: "#4d9fff",
  purple: "#a78bfa", cyan: "#22d3ee",
};

// ── Simulate live engine events ──
const demoEvents = [
  { t: 0, type: "signal", icon: "📡", text: "Signal erkannt", detail: "SELL XAUUSD @ 4530.20", color: T.gold, badge: "SIGNAL" },
  { t: 800, type: "gate", icon: "📊", text: "Spread Check", detail: "0.28 — Normal ✓", color: T.green, badge: "PASS" },
  { t: 1200, type: "gate", icon: "🕐", text: "Session Check", detail: "London Session aktiv ✓", color: T.green, badge: "PASS" },
  { t: 1600, type: "gate", icon: "⚖️", text: "Correlation", detail: "Kein Gold-Trade offen ✓", color: T.green, badge: "PASS" },
  { t: 2200, type: "score", icon: "🎯", text: "Signal Score: 84/100", detail: "Confluence 18 · Trend 13 · S/R 17 · R:R 12 · Spread 10 · Channel 14", color: T.gold, badge: "SCORE" },
  { t: 2800, type: "ai", icon: "🧠", text: "AI: TRADE — SL angepasst", detail: "\"SL 4560 ist zu offensichtlich. Auf 4563 verschoben.\" (Haiku, 142 Tokens)", color: T.purple, badge: "AI" },
  { t: 3200, type: "mode", icon: "📈", text: "Market Mode: TREND", detail: "ADX 31 · RSI 38 · BB 0.018 · Bearish auf H1+H4", color: T.green, badge: "TREND" },
  { t: 3800, type: "exec", icon: "⚡", text: "4 Orders eröffnet", detail: "TP1: 0.12L @ 4500 · TP2: 0.10L @ 4470 · TP3: 0.10L @ 4440 · Runner: 0.08L", color: T.goldLt, badge: "LIVE" },
  { t: 4200, type: "fill", icon: "💰", text: "Fill bestätigt", detail: "Entry: 4530.35 (Slippage +0.15) · SL: 4563 · Lots: 0.40 total", color: T.blue, badge: "FILL" },
  { t: 8000, type: "tick", icon: "🔄", text: "Tick #1 — alles stabil", detail: "Preis: 4528.10 · Floating: +€22 · SL: 4563 · Kein DCA nötig", color: T.dim, badge: "30s" },
  { t: 16000, type: "tick", icon: "🔄", text: "Tick #2 — Preis fällt", detail: "Preis: 4519.50 · Floating: +€108 · Momentum steigend", color: T.dim, badge: "30s" },
  { t: 24000, type: "dca", icon: "💎", text: "Preis steigt kurz — kein DCA", detail: "Preis: 4525.80 · 0% zum SL · DCA-Trigger bei 33%", color: T.dim, badge: "30s" },
  { t: 38000, type: "tp", icon: "✅", text: "TP1 getroffen!", detail: "0.12L geschlossen @ 4500 · +€36.30 · SL aller Orders → 4532 (BE+2)", color: T.green, badge: "TP1" },
  { t: 39000, type: "trail", icon: "📐", text: "Step Trail aktiviert", detail: "Alle SL → 4532.35 (Breakeven + 2 Pips) · 0% Risiko ab jetzt", color: T.green, badge: "BE" },
  { t: 58000, type: "tp", icon: "✅", text: "TP2 getroffen!", detail: "0.10L geschlossen @ 4470 · +€60.20 · SL → 4500 (TP1 Level)", color: T.green, badge: "TP2" },
  { t: 59000, type: "trail", icon: "📐", text: "Step Trail: SL auf TP1", detail: "Runner + TP3 SL → 4500 · +30 Pips gesichert", color: T.gold, badge: "STEP" },
  { t: 62000, type: "pyramid", icon: "🏔️", text: "Pyramiding! +0.03L", detail: "ADX 34 — Momentum stark · Neue SELL @ 4468 · SL 4500 (TP2) · 0% Extra-Risiko", color: T.goldLt, badge: "PYRAMID" },
  { t: 78000, type: "tp", icon: "✅", text: "TP3 getroffen!", detail: "0.10L geschlossen @ 4440 · +€90.50 · Runner SL → 4470 (TP2)", color: T.green, badge: "TP3" },
  { t: 80000, type: "trail", icon: "📐", text: "ATR Trail aktiv auf Runner", detail: "ATR(M5): 16.8 · Trail Distance: 20.2 · SL: 4458.80", color: T.purple, badge: "ATR" },
  { t: 95000, type: "trail", icon: "📐", text: "Runner trailed", detail: "Neues Low: 4402 · SL → 4422.20 · Gesichert: +108 Pips", color: T.gold, badge: "TRAIL" },
  { t: 110000, type: "trail", icon: "📐", text: "Runner trailed weiter", detail: "Neues Low: 4388 · SL → 4408.20 · Gesichert: +122 Pips", color: T.gold, badge: "TRAIL" },
  { t: 125000, type: "close", icon: "🏆", text: "Runner ausgestoppt @ 4408", detail: "0.08L · +€97.80 · Pyramid auch gestoppt: +€18.00", color: T.green, badge: "CLOSE" },
  { t: 126000, type: "result", icon: "📊", text: "Trade komplett: +€302.80", detail: "TP1: €36 · TP2: €60 · TP3: €91 · Runner: €98 · Pyramid: €18", color: T.green, badge: "PROFIT" },
  { t: 127000, type: "ai", icon: "🧠", text: "AI Post-Trade Analyse", detail: "\"Guter Trade. ATR Trail hätte ×1.0 statt ×1.2 sein können — 10 Pips mehr.\"", color: T.purple, badge: "AI" },
  { t: 128000, type: "log", icon: "🗄️", text: "In Supabase geloggt", detail: "Win Rate Channel: 76% · Anti-Tilt: 0 Losses · Score bleibt hoch", color: T.blue, badge: "LOG" },
];

interface DemoEvent {
  t: number;
  type: string;
  icon: string;
  text: string;
  detail: string;
  color: string;
  badge: string;
  idx?: number;
}

function LiveTerminal({ events, speed = 1 }: { events: DemoEvent[]; speed?: number }) {
  const [visible, setVisible] = useState<DemoEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const start = () => {
    setVisible([]);
    setIsRunning(true);
    setProgress(0);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const maxT = Math.max(...events.map(e => e.t));

    events.forEach((event, i) => {
      const tid = setTimeout(() => {
        setVisible(prev => [...prev, { ...event, idx: i }]);
        setProgress(event.t / maxT * 100);
        if (i === events.length - 1) {
          setTimeout(() => { setIsRunning(false); setProgress(100); }, 1000);
        }
      }, event.t / speed);
      timeoutsRef.current.push(tid);
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visible]);

  // Auto-start
  useEffect(() => { start(); return () => timeoutsRef.current.forEach(clearTimeout); }, []);

  const totalProfit = visible.find(e => e.type === "result");

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", background: T.bg2, border: `1px solid ${T.gold}15` }}>
      {/* Terminal Header */}
      <div style={{ padding: "10px 14px", background: T.bg3, borderBottom: `1px solid ${T.gold}10`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.red }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isRunning ? T.green : T.dim }} />
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: T.dim }}>gold-foundry-engine-v3</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isRunning && (
            <span style={{ fontSize: 10, color: T.green, animation: "pulse 1.5s infinite" }}>● LIVE</span>
          )}
          {totalProfit && (
            <span style={{ fontFamily: "monospace", fontSize: 14, color: T.green, fontWeight: 700 }}>+€302.80</span>
          )}
          <button onClick={start} style={{
            padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.gold}30`,
            background: "transparent", color: T.gold, fontSize: 11, cursor: "pointer",
            fontFamily: "monospace",
          }}>
            ▶ Replay
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: T.bg3 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${T.gold}, ${T.green})`, transition: "width 0.3s" }} />
      </div>

      {/* Events */}
      <div ref={scrollRef} style={{ maxHeight: 480, overflowY: "auto", padding: "8px 0" }}>
        {visible.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: T.dim, fontSize: 13 }}>
            Warte auf Signal...
          </div>
        )}

        {visible.map((event, i) => (
          <div key={i} style={{
            padding: "6px 14px", display: "flex", gap: 8, alignItems: "flex-start",
            background: event.type === "result" ? `${T.green}08` : event.type === "close" ? `${T.green}04` : "transparent",
            animation: "fadeSlideIn 0.3s ease",
            borderBottom: `1px solid ${T.bg3}`,
          }}>
            {/* Timestamp */}
            <span style={{
              fontFamily: "monospace", fontSize: 10, color: T.dim, minWidth: 42,
              paddingTop: 3,
            }}>
              {formatTime(event.t)}
            </span>

            {/* Badge */}
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
              minWidth: 44, textAlign: "center",
              color: event.color,
              background: `${event.color}15`,
              border: `1px solid ${event.color}20`,
              flexShrink: 0,
            }}>
              {event.badge}
            </span>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{event.icon}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: event.type === "result" ? T.green : event.type === "gate" ? (event.badge === "PASS" ? T.green : T.red) : T.bright,
                }}>
                  {event.text}
                </span>
              </div>
              <div style={{
                fontSize: 11, color: T.dim, marginTop: 2, lineHeight: 1.4,
                fontFamily: event.type === "ai" ? "'Inter', sans-serif" : "monospace",
                fontStyle: event.type === "ai" ? "italic" : "normal",
              }}>
                {event.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{
        padding: "8px 14px", background: T.bg3, borderTop: `1px solid ${T.gold}10`,
        display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "monospace",
      }}>
        <span style={{ color: T.dim }}>Events: {visible.length}/{events.length}</span>
        <span style={{ color: T.dim }}>
          AI Calls: <span style={{ color: T.purple }}>{visible.filter(e => e.type === "ai").length}</span>
          {" · "}Gates: <span style={{ color: T.green }}>{visible.filter(e => e.type === "gate").length}</span>
          {" · "}TPs: <span style={{ color: T.green }}>{visible.filter(e => e.type === "tp").length}</span>
        </span>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

// ── Stat Cards ──
function StatCards({ events }: { events: DemoEvent[] }) {
  const tps = events.filter(e => e.type === "tp");
  const ais = events.filter(e => e.type === "ai");
  const gates = events.filter(e => e.type === "gate" && e.badge === "PASS");

  const stats = [
    { label: "Profit", value: "+€302.80", color: T.green },
    { label: "Win Rate", value: "4/4 TPs", color: T.green },
    { label: "AI Calls", value: "2", color: T.purple },
    { label: "Kosten", value: "$0.0001", color: T.gold },
    { label: "Dauer", value: "~2h", color: T.blue },
    { label: "Risiko nach TP1", value: "0%", color: T.green },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 12 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: "10px 8px", borderRadius: 10, background: T.bg2, border: `1px solid ${s.color}12`, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: T.dim }}>{s.label}</div>
          <div style={{ fontFamily: "monospace", fontSize: 16, color: s.color, fontWeight: 700, marginTop: 2 }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function EngineDashboard() {
  const [speed, setSpeed] = useState(8);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif", padding: "32px 16px 60px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: T.gold, letterSpacing: 4, fontWeight: 600 }}>GOLD FOUNDRY ENGINE v3</div>
          <h1 style={{ color: T.bright, fontSize: "clamp(18px, 4.5vw, 26px)", fontWeight: 800, margin: "6px 0 4px" }}>
            Live: Was passiert nach einem Signal?
          </h1>
          <p style={{ color: T.dim, fontSize: 12, margin: 0 }}>
            Echtzeitansicht aller 13 Systeme. Jeder Schritt sichtbar.
          </p>
        </div>

        {/* Speed Control */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 12 }}>
          {[{ s: 16, l: "Schnell" }, { s: 8, l: "Normal" }, { s: 2, l: "Echtzeit" }].map(opt => (
            <button key={opt.s} onClick={() => setSpeed(opt.s)}
              style={{
                padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                background: speed === opt.s ? `${T.gold}20` : T.bg2,
                color: speed === opt.s ? T.gold : T.dim,
                fontSize: 11, fontWeight: speed === opt.s ? 700 : 500,
              }}>
              {opt.l}
            </button>
          ))}
        </div>

        {/* TERMINAL */}
        <LiveTerminal events={demoEvents} speed={speed} />

        {/* STAT CARDS */}
        <StatCards events={demoEvents} />

        {/* LEGEND */}
        <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: T.bg2, border: `1px solid rgba(212,165,55,0.06)` }}>
          <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, marginBottom: 8 }}>LEGENDE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              { badge: "SIGNAL", color: T.gold, desc: "Telegram Signal empfangen" },
              { badge: "PASS", color: T.green, desc: "Sicherheits-Check bestanden" },
              { badge: "SCORE", color: T.gold, desc: "Signal bewertet (0-100)" },
              { badge: "AI", color: T.purple, desc: "AI Bewertung (nur 2× pro Trade)" },
              { badge: "LIVE", color: T.goldLt, desc: "Orders eröffnet" },
              { badge: "30s", color: T.dim, desc: "30-Sekunden Engine-Tick" },
              { badge: "TP1-3", color: T.green, desc: "Take Profit getroffen" },
              { badge: "BE", color: T.green, desc: "Breakeven gesetzt — 0% Risiko" },
              { badge: "STEP", color: T.gold, desc: "SL auf TP-Level verschoben" },
              { badge: "ATR", color: T.purple, desc: "Dynamischer ATR-Trail aktiv" },
              { badge: "TRAIL", color: T.gold, desc: "Runner SL nachgezogen" },
              { badge: "PYRAMID", color: T.goldLt, desc: "Position vergrößert (ab TP2)" },
              { badge: "PROFIT", color: T.green, desc: "Trade komplett — Ergebnis" },
              { badge: "LOG", color: T.blue, desc: "In Datenbank gespeichert" },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, background: `${l.color}08` }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: l.color, padding: "1px 4px", borderRadius: 3, background: `${l.color}15` }}>{l.badge}</span>
                <span style={{ fontSize: 10, color: T.dim }}>{l.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* INTEGRATION HINT */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: `${T.gold}06`, border: `1px solid ${T.gold}15` }}>
          <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, marginBottom: 6 }}>INTEGRATION</div>
          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>
            Im echten Dashboard: Events kommen per WebSocket/Supabase Realtime vom Server. Jeder <code style={{ color: T.gold, background: T.bg3, padding: "1px 4px", borderRadius: 3, fontSize: 11 }}>console.log</code> in der Engine wird zu einem Event das hier live angezeigt wird. Der User sieht in Echtzeit was die AI und die Engine mit seinem Geld machen.
          </div>
        </div>

      </div>
    </div>
  );
}
