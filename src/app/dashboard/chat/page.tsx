// src/app/dashboard/chat/page.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import FeatureGate from "@/components/FeatureGate";

interface Message { role: "user" | "assistant"; content: string }

const WELCOME = "Hey! Ich bin FORGE Mentor \u2014 dein KI-Trading-Analyst.\n\nIch kenne deine Konten, analysiere Trades in Echtzeit und optimiere deine Strategie. Frag mich alles!";

const QUICK_ACTIONS = [
  { label: "Status-Check", icon: "\ud83d\udcca", q: "Wie steht mein Account? Gib mir einen kompletten Status-Check." },
  { label: "Trades analysieren", icon: "\ud83d\udd2c", q: "Analysiere meine letzten Trades. Wo kann ich mich verbessern?" },
  { label: "Markt-Update", icon: "\ud83c\udf0d", q: "Was passiert gerade am Markt? Gibt es Risiken?" },
  { label: "Strategie", icon: "\u2699\ufe0f", q: "Schlage mir eine optimale Strategie vor basierend auf meinen Daten." },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || streaming) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Anfrage fehlgeschlagen");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n").filter(l => l.startsWith("data: "))) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              assistantMsg += data.text;
              setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: assistantMsg }]);
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      if (!assistantMsg) {
        setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: "Keine Antwort erhalten. Bitte versuche es nochmal." }]);
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev.slice(0, prev[prev.length - 1]?.content === "" ? -1 : prev.length),
        { role: "assistant", content: `Fehler: ${e.message || "Verbindungsproblem"}. Bitte versuche es nochmal.` },
      ]);
    }
    setStreaming(false);
    inputRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send();
  }

  return (
    <FeatureGate minTier="analyzer" featureName="FORGE Mentor" landingPage="/">
    <div className="flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>

      {/* Features Bar */}
      {messages.length <= 1 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { icon: "\ud83d\udcca", title: "Trade-Analyse", desc: "Win Rate, R:R, Muster" },
            { icon: "\ud83d\udee1\ufe0f", title: "Risk-Coaching", desc: "DD, Lots, Risk Management" },
            { icon: "\ud83c\udf0d", title: "Markt-Intel", desc: "News, Sentiment, Regime" },
            { icon: "\u2699\ufe0f", title: "Strategie-Lab", desc: "Copier-Settings optimieren" },
          ].map(f => (
            <div key={f.title} className="gf-panel p-4">
              <div className="text-xl mb-2">{f.icon}</div>
              <div className="text-xs font-semibold text-white mb-0.5">{f.title}</div>
              <div className="text-[10px] text-zinc-600">{f.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto space-y-3 mb-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl ${m.role === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
              style={{
                padding: "14px 18px",
                background: m.role === "user"
                  ? "rgba(250,239,112,0.06)"
                  : "var(--gf-panel)",
                border: `1px solid ${m.role === "user" ? "rgba(250,239,112,0.12)" : "var(--gf-border)"}`,
              }}
            >
              {m.role === "assistant" && i > 0 && (
                <div className="text-[10px] font-medium tracking-wide mb-2" style={{ color: "var(--gf-gold)" }}>FORGE MENTOR</div>
              )}
              {m.role === "assistant" && i === 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: "rgba(250,239,112,0.08)", border: "1px solid rgba(250,239,112,0.12)" }}>{"\ud83e\udde0"}</div>
                  <div className="text-[10px] font-medium tracking-wide" style={{ color: "var(--gf-gold)" }}>FORGE MENTOR</div>
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: m.role === "user" ? "var(--gf-text-bright)" : "var(--gf-text)" }}>
                {m.content}
                {streaming && i === messages.length - 1 && m.role === "assistant" && (
                  <span className="inline-block w-2 h-4 ml-0.5 rounded-sm animate-pulse" style={{ background: "var(--gf-gold)" }} />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {QUICK_ACTIONS.map(q => (
          <button
            key={q.label}
            onClick={() => send(q.q)}
            disabled={streaming}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all hover:scale-[1.02]"
            style={{ background: "rgba(250,239,112,0.04)", border: "1px solid rgba(250,239,112,0.1)", color: "var(--gf-gold)" }}
          >
            <span>{q.icon}</span> {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          ref={inputRef}
          className="gf-input flex-1 !py-3"
          placeholder="Frag FORGE Mentor..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={streaming}
        />
        <button type="submit" className="gf-btn !px-6 !py-3" disabled={streaming || !input.trim()}>
          {streaming ? (
            <span className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          ) : "\u2192"}
        </button>
      </form>
    </div>
    </FeatureGate>
  );
}
