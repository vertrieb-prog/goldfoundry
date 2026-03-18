// src/app/dashboard/chat/page.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import FeatureGate from "@/components/FeatureGate";

interface Message { role: "user" | "assistant"; content: string; }

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hey Eric! Ich bin dein FORGE Mentor. Deine Konten laufen stabil — TEGAS FX bei 67.2% Buffer, TAG Markets bei 43.1%. Heute +€399.60 über beide Konten. Der Copier hat 2 Trades wegen News-Events übersprungen (NFP morgen). Frag mich alles!",
};

const QUICK_ACTIONS = ["Status-Check", "Trades analysieren", "Markt-Update", "Strategie optimieren"];

const MENTOR_FEATURES = [
  {
    title: "Trade-Analyse",
    desc: "Detaillierte Analyse deiner letzten Trades mit Win Rate, R:R und Muster-Erkennung.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    title: "Risiko-Coaching",
    desc: "Echtzeit-Feedback zu Drawdown, Positionsgröße und Risk Management.",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z",
  },
  {
    title: "Markt-Intel",
    desc: "News-Events, Volatilität, Regime-Erkennung und Sentiment in Echtzeit.",
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
  },
  {
    title: "Strategie-Optimierung",
    desc: "Vorschläge zur Verbesserung deiner Copier-Einstellungen und Multiplier.",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    icon2: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMsg }) });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              assistantMsg += data.text;
              setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: assistantMsg }]);
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: "Verbindungsfehler. Bitte erneut versuchen." }]);
    }
    setStreaming(false);
  }

  function handleQuickAction(action: string) {
    setInput(action);
  }

  return (
    <FeatureGate minTier="analyzer" featureName="FORGE Mentor" landingPage="/forge-mentor">
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>FORGE Mentor</h1>
        <p className="text-sm" style={{ color: "var(--gf-text-dim)" }}>Dein Quant-Analyst. Kennt deine Trades, Konten, und den Markt.</p>
      </div>

      {/* MENTOR FEATURES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {MENTOR_FEATURES.map((f) => (
          <div key={f.title} className="gf-panel p-4" style={{
            background: "linear-gradient(135deg, var(--gf-panel), rgba(212,165,55,0.02))",
          }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{
              background: "rgba(212,165,55,0.08)",
              border: "1px solid rgba(212,165,55,0.12)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a537" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={f.icon} />
                {f.icon2 && <path d={f.icon2} />}
              </svg>
            </div>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--gf-text-bright)" }}>{f.title}</div>
            <div className="text-[10px] leading-relaxed" style={{ color: "var(--gf-text-dim)" }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-auto space-y-4 pr-2 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded`}
              style={{
                background: m.role === "user" ? "rgba(212,165,55,0.08)" : "var(--gf-panel)",
                border: "1px solid var(--gf-border)",
                color: "var(--gf-text)",
              }}>
              {m.role === "assistant" && <div className="text-[10px] tracking-widest mb-2" style={{ color: "var(--gf-gold)" }}>FORGE Mentor</div>}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}{streaming && i === messages.length - 1 && m.role === "assistant" && <span className="animate-pulse" style={{ color: "var(--gf-gold)" }}>&#9612;</span>}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_ACTIONS.map(q => (
          <button key={q} onClick={() => handleQuickAction(q)} className="gf-btn-outline text-xs !px-3 !py-1.5">{q}</button>
        ))}
      </div>

      {/* INPUT */}
      <form onSubmit={send} className="flex gap-3">
        <input className="gf-input flex-1" placeholder="Frag FORGE Mentor..." value={input} onChange={e => setInput(e.target.value)} disabled={streaming} />
        <button type="submit" className="gf-btn !px-6" disabled={streaming}>{streaming ? "..." : "→"}</button>
      </form>
    </div>
    </FeatureGate>
  );
}
