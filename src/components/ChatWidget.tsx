// src/components/ChatWidget.tsx
// ============================================================
// FORGE Mentor Chat Widget — Begleitet den User auf JEDER Seite
// Kontextueller Guide + Auto-Greeting + Streamed Responses
// ============================================================

"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant" | "greeting";
  text: string;
}

/* ── Page-specific context messages ── */
const PAGE_CONTEXT: Record<string, { greeting: string; actions: { label: string; q: string }[] }> = {
  "/": {
    greeting: "Hey! Ich bin FORGE Mentor — dein Trading-Mentor.\n\nDu bist auf der Startseite von Gold Foundry. Das hier ist kein normales Trading-Tool — es ist ein komplettes AI-Trading-Ökosystem.\n\n🔥 Copier, Risk Engine, Market Intel, Strategy Lab — alles in einem.\n\nFrag mich alles oder erstell dir einen Account — ich begleite dich durch jeden Schritt.",
    actions: [
      { label: "Was ist Gold Foundry?", q: "Erkläre mir Gold Foundry in 3 Sätzen. Was macht euch besser?" },
      { label: "Wie funktioniert der Copier?", q: "Wie funktioniert der Smart Copier genau? Was sind die 7 Schutz-Faktoren?" },
      { label: "Pricing erklären", q: "Welche Pläne gibt es und was ist der Unterschied?" },
      { label: "Account erstellen", q: "Ich will starten. Was muss ich tun?" },
    ],
  },
  "/auth/login": {
    greeting: "Willkommen zurück! 👋\n\nGib deine E-Mail und dein Passwort ein um dich einzuloggen.\n\nNach dem Login siehst du sofort dein Dashboard mit:\n• Live Equity & P/L\n• Copier Status & Risk Engine\n• FORGE Mentor Analyse\n\nNoch keinen Account? Klick unten auf \"Registrieren\".",
    actions: [
      { label: "Passwort vergessen", q: "Ich habe mein Passwort vergessen. Was kann ich tun?" },
      { label: "Account erstellen", q: "Ich habe noch keinen Account. Wie registriere ich mich?" },
      { label: "Was erwartet mich?", q: "Was sehe ich nach dem Login? Erkläre mir das Dashboard." },
    ],
  },
  "/auth/register": {
    greeting: "Gute Entscheidung! 🚀\n\nIn 60 Sekunden hast du deinen Account.\n\n📝 So geht's:\n1. E-Mail & Passwort eingeben\n2. Bestätigungsmail klicken\n3. Dashboard öffnet sich\n4. MT-Konto verbinden → Copier läuft!\n\nDer Free-Plan gibt dir Zugang zum Dashboard und FORGE Mentor. Für den Copier brauchst du mindestens den Analyzer-Plan (€9/mo).",
    actions: [
      { label: "Welcher Plan für mich?", q: "Ich bin Anfänger. Welchen Plan empfiehlst du mir?" },
      { label: "Was kostet es?", q: "Was bekomme ich im Basis-Plan und was kostet ein Upgrade?" },
      { label: "Demo möglich?", q: "Kann ich erstmal auf einem Demo-Konto testen?" },
    ],
  },
  "/pricing": {
    greeting: "Du schaust dir die Pläne an — gute Idee.\n\nKurz-Überblick:\n\n💡 Analyzer (€9/mo) — Dashboard + FORGE Mentor\n⚡ Copier (€29/mo) — Alles + Smart Copier\n🔥 Pro (€59/mo) — Alles + Strategy Lab + Priority\n👑 Provider (€99/mo) — Signale anbieten + Revenue Share\n\nAlle Pläne haben die 7-Faktor Risk Engine. Frag mich wenn du unsicher bist!",
    actions: [
      { label: "Was ist der Unterschied?", q: "Erkläre mir den Unterschied zwischen Copier und Pro Plan genau." },
      { label: "Lohnt sich Pro?", q: "Lohnt sich der Pro Plan? Was bekomme ich extra?" },
      { label: "Kann ich upgraden?", q: "Kann ich später upgraden wenn ich mit einem kleineren Plan starte?" },
    ],
  },
  "/dashboard": {
    greeting: "Welcome to the Command Center! ⚡\n\nHier siehst du alles auf einen Blick:\n\n📊 Oben: Deine KPIs (Equity, P/L, Drawdown)\n📈 Mitte: Live Equity Curve\n🛡️ Unten: Risk Engine Status\n\nIch analysiere deine Trades in Echtzeit. Frag mich jederzeit was passiert.",
    actions: [
      { label: "Status-Check", q: "Wie steht mein Account gerade? Gib mir einen kompletten Status-Check." },
      { label: "Trades analysieren", q: "Analysiere meine letzten Trades. Wo kann ich mich verbessern?" },
      { label: "Risk Engine erklären", q: "Erkläre mir die 7 Faktoren der Risk Engine und was sie gerade machen." },
      { label: "Was passiert am Markt?", q: "Was passiert gerade am Markt? Gibt es Risiken für meine Positionen?" },
    ],
  },
  "/dashboard/copier": {
    greeting: "Copier-Zentrale! ⚡\n\nHier verwaltest du deine verbundenen MT-Konten.\n\n🟢 Grün = Copier aktiv, Trades werden kopiert\n🔴 Rot = Pausiert (ich sage dir warum)\n\nJedes Konto hat seine eigene Risk Engine mit 7 Schutz-Faktoren. Wenn der Copier pausiert, ist das ABSICHT — er schützt dein Kapital.\n\nFrag mich wenn ein Konto pausiert ist!",
    actions: [
      { label: "Konto verbinden", q: "Wie verbinde ich ein neues MT-Konto mit dem Copier?" },
      { label: "Warum pausiert?", q: "Mein Copier ist pausiert. Warum und wann geht er wieder an?" },
      { label: "Einstellungen erklären", q: "Erkläre mir die Copier-Einstellungen. Was kann ich anpassen?" },
    ],
  },
  "/dashboard/strategy-lab": {
    greeting: "Strategy Lab — dein Quant-Werkzeug! 🔬\n\nHier kannst du:\n1. MQL4/MQL5 Strategien hochladen\n2. AI-Analyse bekommen\n3. Monte Carlo Backtest laufen lassen\n4. Walk-Forward Optimierung starten\n\nFrag mich zu deiner Strategie — ich analysiere sie in Sekunden.",
    actions: [
      { label: "Strategie hochladen", q: "Wie lade ich eine MQL4 Strategie hoch zur Analyse?" },
      { label: "Monte Carlo erklären", q: "Was ist ein Monte Carlo Backtest und warum brauche ich das?" },
      { label: "Strategie optimieren", q: "Kannst du meine aktuelle Strategie optimieren?" },
    ],
  },
  "/dashboard/market-intel": {
    greeting: "Market Intel — dein Radar! 📡\n\nHier fließen alle Daten zusammen:\n\n🌍 Geopolitik-Scanner\n📊 Regime-Detection (Trend/Range/Volatil)\n📅 Economic Calendar\n⚠️ Risk Alerts\n\nAlles was hier aufleuchtet, fließt automatisch in die Copier-Entscheidungen.",
    actions: [
      { label: "Aktuelles Regime?", q: "In welchem Markt-Regime befinden wir uns gerade?" },
      { label: "Risiken heute?", q: "Gibt es heute besondere Risiken oder Events die ich beachten muss?" },
      { label: "Wie nutzt der Copier das?", q: "Wie nutzt der Copier die Market Intel Daten für Entscheidungen?" },
    ],
  },
  "/dashboard/affiliate": {
    greeting: "Partner Program! 💰\n\nVerdiene passiv mit deinem Netzwerk:\n\n📊 30% auf Ebene 1\n📊 10% auf Ebene 2\n📊 5% auf Ebene 3\n\nDein Affiliate-Link ist oben. Teile ihn auf Social Media, in Trading-Gruppen oder mit Freunden.\n\nAuszahlung ab €50 — automatisch zum Monatsende.",
    actions: [
      { label: "Meinen Link teilen", q: "Wie kann ich meinen Affiliate-Link am besten verbreiten?" },
      { label: "Auszahlung?", q: "Wann und wie bekomme ich meine Affiliate-Einnahmen ausgezahlt?" },
      { label: "Wie viel kann ich verdienen?", q: "Rechne mir aus wie viel ich verdienen kann wenn ich 10 Leute werbe." },
    ],
  },
  "/dashboard/accounts": {
    greeting: "Account Tracking! 📊\n\nHier siehst du alle deine verbundenen MT4/MT5 Konten.\n\nJedes Konto wird live über MetaApi getrackt — Equity, Balance, Trades, Win Rate.\n\nWie MyFXBook — nur direkt in Gold Foundry integriert, mit AI-Analyse on top.\n\nKlick auf ein Konto für Details oder füge ein neues hinzu.",
    actions: [
      { label: "Konto hinzufügen", q: "Wie füge ich ein neues MT4/MT5 Konto zum Tracking hinzu?" },
      { label: "Was wird getrackt?", q: "Was genau wird bei meinen Konten getrackt und analysiert?" },
      { label: "MyFXBook Import?", q: "Kann ich meine MyFXBook-Daten importieren?" },
    ],
  },
  "/dashboard/accounts/add": {
    greeting: "Neues Konto verbinden! 🔗\n\nSo geht's in 3 Schritten:\n\n1️⃣ Wähle deinen Broker aus der Suche\n2️⃣ Gib dein Investor-Passwort ein (Read-Only!)\n3️⃣ Fertig — dein Konto wird live getrackt\n\n🔒 Wir nutzen nur Lese-Zugriff. Es werden KEINE Trades ausgeführt.\n\nDu brauchst dein Investor-Passwort — findest du in MT4/MT5 unter Datei → Kontoeinstellungen.",
    actions: [
      { label: "Was ist Investor-Passwort?", q: "Was ist das Investor-Passwort und wo finde ich es?" },
      { label: "Welche Broker?", q: "Welche Broker werden unterstützt? Funktioniert es mit meinem?" },
      { label: "Ist es sicher?", q: "Ist es sicher mein Konto zu verbinden? Was passiert mit meinen Daten?" },
    ],
  },
};

/* ── Fallback for pages without specific context ── */
function getPageContext(path: string) {
  // Exact match first
  if (PAGE_CONTEXT[path]) return PAGE_CONTEXT[path];

  // Prefix match for nested dashboard routes
  for (const [key, val] of Object.entries(PAGE_CONTEXT)) {
    if (path.startsWith(key) && key !== "/") return val;
  }

  // Generic fallback
  return {
    greeting: "Hey! Ich bin FORGE Mentor — dein Trading-Mentor. 🧠\n\nIch begleite dich durch Gold Foundry. Frag mich was du wissen willst!",
    actions: [
      { label: "Was kann ich hier tun?", q: "Was kann ich auf dieser Seite machen?" },
      { label: "Hilfe", q: "Ich brauche Hilfe. Erkläre mir was gerade passiert." },
    ],
  };
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState<any>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ remaining: number; limit: number; used: number } | null>(null);
  const [contextActions, setContextActions] = useState<{ label: string; q: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  // ── Page context greeting (runs on every page) ────────────────
  useEffect(() => {
    const ctx = getPageContext(pathname);
    setContextActions(ctx.actions);

    // If navigating to a new page, show short context note (NOT the full greeting)
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setMsgs(prev => [...prev, { role: "greeting", text: `📍 Du bist jetzt auf ${getPageLabel(pathname)}.` }]);
      setHasUnread(true);
      // Do NOT auto-open — let the bubble pulse instead
      return;
    }

    // First load — show context greeting
    const dashboardPages = ["/dashboard"];
    const isDashboard = dashboardPages.some(p => pathname.startsWith(p));

    // Try API greeting for dashboard (logged-in) pages
    const cached = typeof window !== "undefined" && sessionStorage.getItem("gf_greeting_cache");
    if (cached && isDashboard) {
      try {
        const data = JSON.parse(cached);
        setGreeting(data);
        buildGreetingMsg(data);
      } catch {}
    } else if (isDashboard) {
      fetchGreeting();
    } else {
      // Public page — use local context greeting
      setMsgs([{ role: "greeting", text: ctx.greeting }]);
      setHasUnread(true);
    }

    // No auto-open — chat stays closed, bubble pulses with unread indicator
    // User must click the bubble to open
  }, [pathname]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, open]);

  function getPageLabel(path: string): string {
    const labels: Record<string, string> = {
      "/": "Startseite", "/auth/login": "Login", "/auth/register": "Registrierung",
      "/pricing": "Pricing", "/dashboard": "Dashboard", "/dashboard/copier": "Copier",
      "/dashboard/strategy-lab": "Strategy Lab", "/dashboard/market-intel": "Market Intel",
      "/dashboard/affiliate": "Partner Program", "/leaderboard": "Leaderboard",
    };
    return labels[path] ?? path.split("/").pop()?.replace(/-/g, " ") ?? "Seite";
  }

  function buildGreetingMsg(data: any) {
    let greetText = data.greeting;
    if (data.stats?.accounts?.length) {
      greetText += "\n";
      for (const a of data.stats.accounts) {
        const icon = a.on ? "🟢" : "🔴";
        greetText += `\n${icon} ${a.firm}: €${a.eq?.toLocaleString() ?? 0} · Buffer ${a.buf}%`;
      }
    }
    if (data.stats?.todayPnl !== undefined && data.stats.todayPnl !== 0) {
      greetText += `\n\n📊 Heute: ${data.stats.todayPnl >= 0 ? "+" : ""}€${data.stats.todayPnl} · Woche: ${data.stats.weekPnl >= 0 ? "+" : ""}€${data.stats.weekPnl} · WR: ${data.stats.wr}%`;
    }
    if (data.stats?.affBalance > 0) {
      greetText += `\n💰 €${data.stats.affBalance} Affiliate-Guthaben`;
    }
    if (data.copierAuto?.length) {
      for (const c of data.copierAuto) {
        if (!c.active && c.reason) {
          greetText += `\n\n⚙️ ${c.firm}: ${c.reason}\n→ Startet automatisch.`;
        }
      }
    }
    setMsgs([{ role: "greeting", text: greetText }]);
    setGreeting(data);
    setHasUnread(true);

    // Override actions with logged-in context
    if (data.isPaying) {
      setContextActions([
        { label: "Status-Check", q: "Wie steht mein Account gerade? Kompletter Status-Check." },
        { label: "Trades analysieren", q: "Analysiere meine letzten Trades und zeige mir Verbesserungspotential." },
        { label: "Strategie optimieren", q: "Schlage mir eine optimale Strategie vor basierend auf meinen Daten." },
        { label: "Markt-Update", q: "Was passiert gerade am Markt? Gibt es Risiken?" },
      ]);
    }
  }

  async function fetchGreeting() {
    try {
      const res = await fetch(`/api/greeting?page=${pathname}`);
      if (!res.ok) {
        // Not logged in — fall back to page context
        const ctx = getPageContext(pathname);
        setMsgs([{ role: "greeting", text: ctx.greeting }]);
        setHasUnread(true);
        return;
      }
      const data = await res.json();
      buildGreetingMsg(data);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gf_greeting_cache", JSON.stringify(data));
      }
    } catch {
      const ctx = getPageContext(pathname);
      setMsgs([{ role: "greeting", text: ctx.greeting }]);
      setHasUnread(true);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(p => [...p, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, pageContext: { page: pathname } }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.limitReached) {
          setMsgs(p => [...p, { role: "assistant", text: `⚠️ ${data.message}` }]);
          setUsageInfo(data.usage);
          setLoading(false);
          return;
        }
        if (data.error) {
          setMsgs(p => [...p, { role: "assistant", text: `Fehler: ${data.error}` }]);
          setLoading(false);
          return;
        }
      }

      if (!res.ok) throw new Error("Chat failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let fullText = "";
      setMsgs(p => [...p, { role: "assistant", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              fullText += data.text;
              setMsgs(p => {
                const copy = [...p];
                copy[copy.length - 1] = { role: "assistant", text: fullText };
                return copy;
              });
            }
            if (data.usage) {
              setUsageInfo(data.usage);
            }
          } catch {}
        }
      }
    } catch {
      setMsgs(p => [...p, { role: "assistant", text: "Verbindungsfehler. Bitte versuche es erneut." }]);
    }

    setLoading(false);
  }

  const C = {
    bg: "#0b0b0b", dark: "#111111", panel: "#141414",
    b: "rgba(212,165,55,0.08)", ba: "rgba(212,165,55,0.2)",
    g: "#d4a537", gl: "#f5e6c8", gd: "#8a6a1a",
    t: "#c4b68a", td: "#5a4f3a", tb: "#e8dcc0",
    r: "#c0392b", gr: "#27ae60",
  };

  // ── BUBBLE (collapsed) ──────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setHasUnread(false); }}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.g}, ${C.gd})`,
          border: "none", cursor: "pointer",
          boxShadow: `0 4px 20px rgba(212,165,55,0.3)${hasUnread ? ", 0 0 20px rgba(212,165,55,0.4)" : ""}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.3s",
          animation: hasUnread ? "widgetPulse 2s infinite" : "none",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        <span style={{ fontSize: 24 }}>🧠</span>
        {hasUnread && (
          <span style={{
            position: "absolute", top: -2, right: -2,
            width: 14, height: 14, borderRadius: "50%",
            background: C.r, border: `2px solid ${C.bg}`,
          }} />
        )}
        <style>{`@keyframes widgetPulse{0%,100%{box-shadow:0 4px 20px rgba(212,165,55,0.3)}50%{box-shadow:0 4px 30px rgba(212,165,55,0.5),0 0 20px rgba(212,165,55,0.3)}}`}</style>
      </button>
    );
  }

  // ── CHAT PANEL (expanded) ───────────────────────────────────
  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 9999,
      width: "min(400px, calc(100vw - 32px))",
      height: "min(560px, calc(100vh - 100px))",
      borderRadius: 16, overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: C.panel,
      border: `1px solid ${C.ba}`,
      boxShadow: "0 12px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,165,55,0.05)",
      fontFamily: "'Outfit', sans-serif",
    }}>

      {/* Header */}
      <div style={{
        padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: C.dark, borderBottom: `1px solid ${C.b}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${C.g}20, ${C.g}08)`,
            border: `1px solid ${C.g}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 16 }}>🧠</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.tb, letterSpacing: 0.5 }}>FORGE Mentor</div>
            <div style={{ fontSize: 9, color: C.g, letterSpacing: 2, fontWeight: 500 }}>DEIN TRADING-MENTOR</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {usageInfo && (
            <span style={{ fontSize: 9, color: usageInfo.remaining < 5 ? C.r : C.td, fontFamily: "JetBrains Mono" }}>
              {usageInfo.remaining}/{usageInfo.limit}
            </span>
          )}
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gr, boxShadow: `0 0 6px ${C.gr}` }} />
          <button onClick={() => setOpen(false)} style={{
            background: "none", border: "none", color: C.td, cursor: "pointer", fontSize: 18, padding: 4,
          }}>×</button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column",
            alignItems: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            {m.role !== "user" && (
              <span style={{ fontSize: 8, color: C.td, marginBottom: 3, letterSpacing: 1.5, fontWeight: 500 }}>
                {m.role === "greeting" ? "FORGE Mentor" : "FORGE Mentor"}
              </span>
            )}
            <div style={{
              maxWidth: "88%", padding: "10px 14px", borderRadius: 10, fontSize: 12, lineHeight: 1.7,
              whiteSpace: "pre-line", wordBreak: "break-word",
              background: m.role === "user" ? `${C.g}18` : C.dark,
              border: `1px solid ${m.role === "user" ? C.ba : C.b}`,
              color: m.role === "user" ? C.gl : C.t,
              ...(m.role === "greeting" ? { borderColor: `${C.g}20`, background: `linear-gradient(135deg, ${C.g}08, ${C.dark})` } : {}),
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 4, padding: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: C.g,
                opacity: 0.4, animation: `dotPulse 1s ${i * 0.2}s infinite`,
              }} />
            ))}
            <style>{`@keyframes dotPulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: 10, borderTop: `1px solid ${C.b}`, display: "flex", gap: 8, background: C.dark,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Frag deinen Mentor..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 12,
            background: C.bg, border: `1px solid ${C.b}`, color: C.tb,
            outline: "none", fontFamily: "Outfit",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "10px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600,
            background: `linear-gradient(135deg, ${C.g}, ${C.gd})`,
            color: C.bg, border: "none", cursor: loading ? "wait" : "pointer",
            fontFamily: "Outfit", opacity: loading ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          →
        </button>
      </div>

      {/* Quick Actions — always visible, context-aware */}
      <div style={{
        padding: "8px 12px", borderTop: `1px solid ${C.b}`,
        display: "flex", gap: 6, overflowX: "auto", background: C.dark,
      }}>
        {contextActions.map((btn, i) => (
          <button key={i} onClick={() => { setInput(btn.q); }} style={{
            padding: "6px 12px", borderRadius: 20, fontSize: 10, whiteSpace: "nowrap",
            background: `${C.g}10`, border: `1px solid ${C.b}`, color: C.g,
            cursor: "pointer", fontFamily: "Outfit",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${C.g}20`; e.currentTarget.style.borderColor = `${C.g}30`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${C.g}10`; e.currentTarget.style.borderColor = C.b; }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
