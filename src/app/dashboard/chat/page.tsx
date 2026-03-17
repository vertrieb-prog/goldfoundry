// src/app/dashboard/chat/page.tsx
"use client";
import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string; }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
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
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Verbindungsfehler. Bitte erneut versuchen." }]);
    }
    setStreaming(false);
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>🧠 FORGE Mentor</h1>
        <p className="text-sm" style={{ color: "var(--gf-text-dim)" }}>Dein Quant-Analyst. Kennt deine Trades, Konten, und den Markt.</p>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-auto space-y-4 pr-2 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🧠</div>
            <p className="text-lg mb-2" style={{ color: "var(--gf-text-bright)" }}>Frag mich alles über dein Trading.</p>
            <p className="text-sm" style={{ color: "var(--gf-text-dim)" }}>Ich habe Zugriff auf deine Trades, Konten, DD-Status, Market Intel, und den Copier Log.</p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {["Wie stehen meine Konten?", "Analyse meiner letzten 20 Trades", "Was passiert heute am Markt?", "Warum hat der Copier geskippt?"].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="gf-btn-outline text-xs !px-3 !py-1.5">{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded ${m.role === "user" ? "" : ""}`}
              style={{
                background: m.role === "user" ? "rgba(212,165,55,0.08)" : "var(--gf-panel)",
                border: "1px solid var(--gf-border)",
                color: "var(--gf-text)",
              }}>
              {m.role === "assistant" && <div className="text-[10px] tracking-widest mb-2" style={{ color: "var(--gf-gold)" }}>FORGE Mentor</div>}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}{streaming && i === messages.length - 1 && m.role === "assistant" && <span className="animate-pulse" style={{ color: "var(--gf-gold)" }}>▌</span>}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={send} className="flex gap-3">
        <input className="gf-input flex-1" placeholder="Frag FORGE Mentor..." value={input} onChange={e => setInput(e.target.value)} disabled={streaming} />
        <button type="submit" className="gf-btn !px-6" disabled={streaming}>{streaming ? "..." : "→"}</button>
      </form>
    </div>
  );
}
