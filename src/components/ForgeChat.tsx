// src/components/ForgeChat.tsx
"use client";
import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string }

/** Converts markdown-style text to clean HTML for chat display */
function formatChat(text: string): string {
  return text
    // Headers: ## or # → bold large text
    .replace(/^###\s+(.+)$/gm, '<div style="font-size:15px;font-weight:700;color:#faef70;margin:10px 0 4px">$1</div>')
    .replace(/^##\s+(.+)$/gm, '<div style="font-size:16px;font-weight:700;color:#faef70;margin:12px 0 4px">$1</div>')
    .replace(/^#\s+(.+)$/gm, '<div style="font-size:17px;font-weight:700;color:#faef70;margin:14px 0 6px">$1</div>')
    // Bold: **text** → <strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:600">$1</strong>')
    // Italic: *text* → <em>
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Bullet lists: - item or • item
    .replace(/^[-•]\s+(.+)$/gm, '<div style="padding-left:12px;margin:2px 0">▸ $1</div>')
    // Numbered lists: 1. item
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div style="padding-left:12px;margin:2px 0"><span style="color:#faef70;font-weight:600">$1.</span> $2</div>')
    // Emoji indicators for status
    .replace(/✅/g, '<span style="color:#4ade80">✅</span>')
    .replace(/❌/g, '<span style="color:#f87171">❌</span>')
    .replace(/⚠️/g, '<span style="color:#fbbf24">⚠️</span>')
    // Horizontal rules
    .replace(/^[-=]{3,}$/gm, '<div style="border-top:1px solid rgba(250,239,112,0.15);margin:8px 0"></div>')
    // Code inline: `code`
    .replace(/`([^`]+)`/g, '<code style="background:rgba(250,239,112,0.08);padding:1px 5px;border-radius:4px;font-size:12px;color:#faef70">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

const WELCOME = "Hey! Ich bin FORGE Mentor \u2014 dein pers\u00f6nlicher KI-Trading-Agent.\n\nIch kenne deine Konten, analysiere Trades in Echtzeit und optimiere deine Strategie. Frag mich alles!";

const QUICK_ACTIONS = [
  { label: "Status-Check", icon: "\ud83d\udcca", q: "Wie steht mein Account? Gib mir einen kompletten Status-Check mit allen Zahlen." },
  { label: "Trade-Analyse", icon: "\ud83d\udd2c", q: "Analysiere meine letzten 30 Tage Trades. Was läuft gut, was nicht?" },
  { label: "Markt-Update", icon: "\ud83c\udf0d", q: "Was passiert gerade am Markt? Aktuelle Risiken und Chancen?" },
  { label: "Investment-Plan", icon: "\ud83c\udfaf", q: "Erstelle mir einen Investment-Plan. Wie kann ich mein Kapital am besten wachsen lassen?" },
  { label: "Compounding", icon: "\ud83d\udcc8", q: "Berechne mir eine Zinseszins-Projektion basierend auf meiner aktuellen Performance." },
  { label: "Positionen", icon: "\u26a1", q: "Welche Trades sind gerade offen? Zeig mir alle Positionen." },
];

export default function ForgeChat() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
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
            if (data.status) {
              setToolStatus(data.status);
            }
            if (data.text) {
              setToolStatus(null);
              assistantMsg += data.text;
              setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: assistantMsg }]);
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      if (!assistantMsg) {
        setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: "Keine Antwort erhalten. Bitte versuche es nochmal." }]);
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Verbindungsproblem";
      setMessages(prev => [
        ...prev.slice(0, prev[prev.length - 1]?.content === "" ? -1 : prev.length),
        { role: "assistant", content: `Fehler: ${errMsg}. Bitte versuche es nochmal.` },
      ]);
    }
    setStreaming(false);
    setToolStatus(null);
    inputRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send();
  }

  return (
    <div className="gf-panel flex flex-col" style={{ height: "100%", minHeight: "500px" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--gf-border)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{
          background: "rgba(250,239,112,0.08)", border: "1px solid rgba(250,239,112,0.15)",
        }}>{"\ud83e\udde0"}</div>
        <div>
          <div className="text-sm font-bold text-white">FORGE Mentor</div>
          <div className="text-[10px]" style={{ color: "var(--gf-gold)" }}>KI-Trading-Agent</div>
        </div>
        {streaming && (
          <div className="ml-auto flex items-center gap-1.5 text-[10px]" style={{ color: "var(--gf-gold)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {toolStatus || "denkt nach..."}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl ${m.role === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
              style={{
                padding: "12px 16px",
                background: m.role === "user" ? "rgba(250,239,112,0.06)" : "var(--gf-obsidian, #0d0d0d)",
                border: `1px solid ${m.role === "user" ? "rgba(250,239,112,0.12)" : "rgba(250,239,112,0.06)"}`,
              }}
            >
              {m.role === "assistant" && (
                <div className="text-[9px] font-medium tracking-wide mb-1.5" style={{ color: "var(--gf-gold)" }}>FORGE MENTOR</div>
              )}
              <div className="text-sm leading-relaxed" style={{
                color: m.role === "user" ? "var(--gf-text-bright)" : "var(--gf-text)",
              }}>
                {m.role === "user" ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: formatChat(m.content) }} />
                )}
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
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
        {QUICK_ACTIONS.map(q => (
          <button
            key={q.label}
            onClick={() => send(q.q)}
            disabled={streaming}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap transition-all hover:scale-[1.02] flex-shrink-0"
            style={{ background: "rgba(250,239,112,0.04)", border: "1px solid rgba(250,239,112,0.1)", color: "var(--gf-gold)" }}
          >
            <span>{q.icon}</span> {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3" style={{ borderTop: "1px solid var(--gf-border)" }}>
        <input
          ref={inputRef}
          className="gf-input flex-1 !py-2.5 text-sm"
          placeholder="Frag FORGE Mentor..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={streaming}
        />
        <button type="submit" className="gf-btn !px-5 !py-2.5" disabled={streaming || !input.trim()}>
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
  );
}
