"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4 | 5;
type ActiveChannel = { id: string; channelId: string; channel_id: string; channelName: string; channel_name: string; status: string; settings: any };

// Jeder mögliche Fehler bekommt eine Lösung — NIEMALS rohe API-Codes zeigen
const ERROR_SOLUTIONS: { match: string; message: string; action?: string; actionLabel?: string }[] = [
  // Telefonnummer
  { match: "PHONE_NUMBER_INVALID", message: "Die Telefonnummer ist ungültig.", action: "step1", actionLabel: "Nummer ändern" },
  { match: "PHONE_NUMBER_BANNED", message: "Diese Nummer ist bei Telegram gesperrt. Nutze eine andere Nummer.", action: "step1", actionLabel: "Andere Nummer eingeben" },
  { match: "PHONE_NUMBER_FLOOD", message: "Zu viele Versuche. Warte 10 Minuten und versuche es dann nochmal." },
  { match: "PHONE_NUMBER_UNOCCUPIED", message: "Diese Nummer hat kein Telegram-Konto. Erstelle zuerst einen Telegram-Account." },
  // Code
  { match: "PHONE_CODE_EXPIRED", message: "Der Code ist abgelaufen. Fordere einen neuen an.", action: "resend", actionLabel: "Neuen Code senden" },
  { match: "PHONE_CODE_INVALID", message: "Der eingegebene Code ist falsch. Prüfe die Telegram-App auf deinem Handy und gib den 5-stelligen Code ein.", action: "retry", actionLabel: "Nochmal eingeben" },
  { match: "PHONE_CODE_EMPTY", message: "Bitte gib den Code ein, den du in der Telegram-App bekommen hast." },
  // 2FA / Passwort
  { match: "SESSION_PASSWORD_NEEDED", message: "Dein Account hat 2FA aktiviert. Gib dein Cloud-Passwort ein.", action: "step3" },
  { match: "PASSWORD_HASH_INVALID", message: "Falsches Passwort. Das ist dein Telegram Cloud-Passwort (Einstellungen → Datenschutz → Zwei-Schritte-Verifizierung).", action: "retry", actionLabel: "Nochmal versuchen" },
  { match: "SRP_ID_INVALID", message: "Die Sitzung ist abgelaufen. Bitte starte den Prozess von vorne.", action: "step1", actionLabel: "Neu starten" },
  // Session / Verbindung
  { match: "AUTH_KEY_UNREGISTERED", message: "Die Sitzung ist ungültig. Bitte verbinde dich erneut.", action: "step1", actionLabel: "Neu verbinden" },
  { match: "SESSION_REVOKED", message: "Die Telegram-Sitzung wurde widerrufen. Bitte starte neu.", action: "step1", actionLabel: "Neu starten" },
  { match: "CONNECTION_NOT_INITED", message: "Verbindungsproblem. Bitte versuche es in 30 Sekunden nochmal." },
  { match: "Timeout", message: "Die Verbindung zu Telegram hat zu lange gedauert. Bitte versuche es nochmal." },
  { match: "ECONNREFUSED", message: "Telegram-Server nicht erreichbar. Bitte versuche es in 1 Minute nochmal." },
  { match: "NETWORK", message: "Netzwerkfehler. Prüfe deine Internetverbindung und versuche es nochmal." },
  // Flood / Rate Limit
  { match: "FLOOD_WAIT", message: "Telegram hat dich temporär gesperrt. Warte ein paar Minuten und versuche es dann nochmal." },
  { match: "TOO_MANY", message: "Zu viele Versuche. Warte 5 Minuten und versuche es dann nochmal." },
  // Channels
  { match: "CHANNEL_PRIVATE", message: "Dieser Channel ist privat. Tritt ihm zuerst in Telegram bei." },
  { match: "CHANNEL_INVALID", message: "Channel nicht gefunden. Prüfe die ID oder den @username." },
  { match: "INVITE_HASH_EXPIRED", message: "Der Einladungslink ist abgelaufen. Bitte den Channel-Admin um einen neuen." },
  { match: "Maximal 10", message: "Du kannst maximal 10 Channels verbinden. Entferne zuerst einen bestehenden." },
  { match: "bereits verbunden", message: "Dieser Channel ist bereits verbunden." },
  // Auth
  { match: "Nicht eingeloggt", message: "Du bist nicht eingeloggt. Bitte melde dich an.", action: "login", actionLabel: "Zum Login" },
  { match: "Keine ausstehende", message: "Kein Code-Versand gefunden. Bitte sende zuerst einen neuen Code.", action: "step1", actionLabel: "Code senden" },
  // Server
  { match: "Telegram Modul", message: "Das Telegram-System wird gerade gestartet. Versuche es in 1-2 Minuten nochmal." },
  { match: "Telegram API nicht", message: "Telegram ist noch nicht eingerichtet. Kontaktiere den Support über WhatsApp." },
  { match: "Server error", message: "Ein Serverfehler ist aufgetreten. Bitte versuche es in 1 Minute nochmal." },
  { match: "500", message: "Ein technischer Fehler ist aufgetreten. Versuche es in 1 Minute nochmal oder kontaktiere den Support." },
  { match: "502", message: "Der Server ist kurzzeitig nicht erreichbar. Bitte versuche es gleich nochmal." },
  { match: "503", message: "Der Service ist vorübergehend nicht verfügbar. Bitte versuche es in ein paar Minuten nochmal." },
];

function friendlyError(raw: string): { message: string; action?: string; actionLabel?: string } {
  for (const e of ERROR_SOLUTIONS) {
    if (raw.includes(e.match)) return { message: e.message, action: e.action, actionLabel: e.actionLabel };
  }
  // Fallback: NIEMALS den rohen Error zeigen
  return {
    message: "Etwas ist schiefgelaufen. Bitte versuche es nochmal oder kontaktiere unseren Support über WhatsApp.",
    action: "step1",
    actionLabel: "Nochmal versuchen",
  };
}

export default function TelegramPage() {
  const [step, setStep] = useState<Step>(1);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; action?: string; actionLabel?: string } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codeSentAt, setCodeSentAt] = useState(0);

  const [active, setActive] = useState<ActiveChannel[]>([]);
  const [available, setAvailable] = useState<{ id: string; title: string; type: string }[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [manualChannelId, setManualChannelId] = useState("");
  const [manualChannelName, setManualChannelName] = useState("");

  // Signal Training
  const [trainChannel, setTrainChannel] = useState<{ id: string; name: string } | null>(null);
  const [channelMessages, setChannelMessages] = useState<{ id: number; text: string; date: string; isSignal: boolean }[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<number | null>(null);
  const [trainSaving, setTrainSaving] = useState(false);
  const [trainDone, setTrainDone] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<any>(null);
  const [parsingPreview, setParsingPreview] = useState(false);

  // MT4 Connection
  const [mtLogin, setMtLogin] = useState("");
  const [mtPassword, setMtPassword] = useState("");
  const [mtPlatform, setMtPlatform] = useState("mt4");
  const [mtBroker, setMtBroker] = useState("");
  const [mtConnecting, setMtConnecting] = useState(false);
  const [mtResult, setMtResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // User's trading accounts (for channel→account linking)
  const [userAccounts, setUserAccounts] = useState<{ id: string; account_name: string; mt_login: string; broker_server: string }[]>([]);
  useEffect(() => {
    fetch("/api/accounts/list").then(r => r.json()).then(d => {
      if (d.accounts) setUserAccounts(d.accounts);
    }).catch(() => {});
  }, []);

  const linkAccountToChannel = async (channelId: string, accountId: string) => {
    try {
      await fetch("/api/telegram/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, linkedAccountId: accountId }),
      });
    } catch {}
  };

  // Check initial connection
  useEffect(() => {
    fetch("/api/telegram/channels")
      .then(r => r.json())
      .then(d => {
        if (d.connected) {
          setConnected(true);
          setActive(d.activeChannels || []);
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  const api = useCallback(async (url: string, body?: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");
      return data;
    } catch (e: any) {
      setError(friendlyError(e.message));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Error action handler
  const handleErrorAction = (action?: string) => {
    setError(null);
    if (action === "step1") { setStep(1); setCode(""); setPassword(""); }
    else if (action === "step3") { setStep(3); }
    else if (action === "resend") { resendCode(); }
    else if (action === "retry") { /* stay on current step */ }
    else if (action === "login") { window.location.href = "/auth/login"; }
  };

  // Step 1: Send code
  const sendCode = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned.startsWith("+") || cleaned.length < 10) {
      setError({ message: "Bitte gib deine Nummer mit Ländervorwahl ein, z.B. +49 170 1234567", action: "retry", actionLabel: "Nummer korrigieren" });
      return;
    }
    const data = await api("/api/telegram/auth/send-code", { phoneNumber: cleaned });
    if (data?.success) {
      setCodeSentAt(Date.now());
      setCode("");
      setStep(2);
    }
  };

  // Step 2: Verify
  const verifyCode = async () => {
    if (code.length < 4) { setError({ message: "Bitte gib den vollständigen Code ein (5 Ziffern). Du findest ihn in der Telegram-App auf deinem Handy." }); return; }
    const data = await api("/api/telegram/auth/verify", { code: code.trim(), phoneNumber: phone.replace(/\s/g, "") });
    if (!data) return;
    if (data.requires2FA) { setStep(3); return; }
    if (data.success) { setConnected(true); loadChannels(); setStep(4); }
  };

  // Step 3: 2FA
  const verify2FA = async () => {
    const data = await api("/api/telegram/auth/2fa", { password });
    if (data?.success) { setConnected(true); loadChannels(); setStep(4); }
  };

  // Resend code (stay on step 2, just resend)
  const resendCode = async () => {
    setCode("");
    setError(null);
    const cleaned = phone.replace(/\s/g, "");
    const data = await api("/api/telegram/auth/send-code", { phoneNumber: cleaned });
    if (data?.success) {
      setCodeSentAt(Date.now());
      setStep(2);
    }
  };

  // Load channels + available dialogs
  const loadChannels = async () => {
    setLoadingChannels(true);
    const data = await api("/api/telegram/channels");
    if (data) {
      setActive(data.activeChannels || []);
      setAvailable(data.availableChannels || []);
    }
    setLoadingChannels(false);
  };

  // Add channel manually
  const addChannel = async () => {
    if (!manualChannelId) { setError({ message: "Bitte gib eine Channel-ID oder einen @username ein. Beispiel: @goldtrading oder -1001234567890" }); return; }
    const data = await api("/api/telegram/channels/add", {
      channelId: manualChannelId.replace("@", ""),
      channelName: manualChannelName || manualChannelId,
    });
    if (data?.success) {
      setManualChannelId("");
      setManualChannelName("");
      await loadChannels();
    }
  };

  // Open channel training
  const [trainError, setTrainError] = useState("");
  const openTraining = async (channelId: string, channelName: string) => {
    setTrainChannel({ id: channelId, name: channelName });
    setSelectedSignal(null);
    setSelectedUpdate(null);
    setTrainDone(false);
    setTrainError("");
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/telegram/messages?channelId=${encodeURIComponent(channelId)}&limit=200`);
      const data = await res.json();
      if (!res.ok) {
        const debugInfo = data.debug ? `\n\nDebug: ${data.debug.join(" → ")}` : "";
        setTrainError((data.error || "Nachrichten konnten nicht geladen werden") + debugInfo);
        setChannelMessages([]);
      } else {
        setChannelMessages(data.messages || []);
        if ((data.messages || []).length === 0) {
          const debugInfo = data.debug ? `\n\nDebug: ${data.debug.join(" → ")}` : "";
          setTrainError("Keine Nachrichten im Channel gefunden." + debugInfo);
        }
      }
    } catch (err: any) {
      setTrainError("Netzwerkfehler beim Laden der Nachrichten. Bitte versuche es nochmal.");
      setChannelMessages([]);
    }
    setLoadingMessages(false);
  };

  // Save signal training
  const saveTraining = async () => {
    if (!trainChannel || selectedSignal === null) return;
    setTrainSaving(true);
    const signal = channelMessages.find(m => m.id === selectedSignal);
    const update = selectedUpdate !== null ? channelMessages.find(m => m.id === selectedUpdate) : null;
    try {
      await fetch("/api/telegram/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: trainChannel.id,
          channelName: trainChannel.name,
          exampleSignal: signal?.text || "",
          exampleUpdate: update?.text || "",
        }),
      });
      setTrainDone(true);
    } catch {}
    setTrainSaving(false);
  };

  // Remove channel (with error handling)
  const removeChannel = async (channelId: string) => {
    try {
      const res = await fetch("/api/telegram/channels/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(friendlyError(data.error || "Channel konnte nicht entfernt werden"));
        return;
      }
    } catch {
      setError({ message: "Netzwerkfehler beim Entfernen. Bitte versuche es nochmal." });
      return;
    }
    await loadChannels();
  };

  // Disconnect (explicit POST)
  const disconnect = async () => {
    try {
      await fetch("/api/telegram/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch { /* continue anyway */ }
    setConnected(false);
    setStep(1);
    setActive([]);
    setPhone("");
    setCode("");
    setPassword("");
  };

  // Auto-parse signal when selected
  const selectAndParse = async (msgId: number | null) => {
    setSelectedSignal(msgId);
    setParsedPreview(null);
    if (msgId === null) return;
    const signal = channelMessages.find(m => m.id === msgId);
    if (!signal) return;
    setParsingPreview(true);
    try {
      const updateMsg = selectedUpdate !== null ? channelMessages.find(m => m.id === selectedUpdate) : null;
      const res = await fetch("/api/telegram/parse-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: signal.text, updateMessage: updateMsg?.text || "" }),
      });
      const data = await res.json();
      if (data.parsed) setParsedPreview(data.parsed);
    } catch {}
    setParsingPreview(false);
  };

  // Re-parse when update message is selected
  const selectUpdateAndParse = async (msgId: number | null) => {
    setSelectedUpdate(msgId);
    if (selectedSignal === null) return;
    const signal = channelMessages.find(m => m.id === selectedSignal);
    if (!signal) return;
    setParsingPreview(true);
    setParsedPreview(null);
    try {
      const updateMsg = msgId !== null ? channelMessages.find(m => m.id === msgId) : null;
      const res = await fetch("/api/telegram/parse-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: signal.text, updateMessage: updateMsg?.text || "" }),
      });
      const data = await res.json();
      if (data.parsed) setParsedPreview(data.parsed);
    } catch {}
    setParsingPreview(false);
  };

  const codeAge = codeSentAt ? Math.floor((Date.now() - codeSentAt) / 1000) : 0;
  const codeExpired = codeAge > 120;

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // ── Signal Training View ────────────────────────────
  if (trainChannel) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="gf-heading text-xl">Signal-Format lernen</h1>
            <p className="text-sm text-zinc-500 mt-1">{trainChannel.name}</p>
          </div>
          <button onClick={() => setTrainChannel(null)} className="text-xs text-zinc-500 hover:text-white">&larr; Zurück</button>
        </div>

        {trainDone ? (
          <div className="gf-panel p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-bold text-white mb-2">Format gespeichert!</h2>
            <p className="text-sm text-zinc-500 mb-6">Die KI verwendet dieses Format ab jetzt für Signale aus "{trainChannel.name}".</p>
            <button onClick={() => setTrainChannel(null)} className="gf-btn">Zurück zum Dashboard</button>
          </div>
        ) : (
          <>
            {/* Step 1: Signal auswählen */}
            <div className="gf-panel p-5">
              <div className="text-sm font-semibold text-white mb-1">Schritt 1: Signal auswählen</div>
              <p className="text-xs text-zinc-500 mb-4">Klicke auf eine Nachricht die ein <strong className="text-white">Trading-Signal</strong> ist (z.B. "BUY XAUUSD @ 2341")</p>

              {/* Signal-Format Beispiele */}
              <div className="mb-4 p-3 rounded-lg" style={{ background: "rgba(250,239,112,0.03)", border: "1px solid rgba(250,239,112,0.08)" }}>
                <div className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: "var(--gf-gold)" }}>So sieht ein Signal aus:</div>
                <div className="grid gap-2 text-[11px]">
                  <div className="p-2 rounded font-mono" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                    <div className="text-emerald-400">BUY XAUUSD @ 2341.50</div>
                    <div className="text-zinc-500">SL: 2335.00</div>
                    <div className="text-zinc-500">TP1: 2348.00 | TP2: 2355.00</div>
                  </div>
                  <div className="p-2 rounded font-mono" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                    <div className="text-red-400">SELL GOLD 2380</div>
                    <div className="text-zinc-500">Stop Loss 2388</div>
                    <div className="text-zinc-500">Take Profit 2365 / 2350</div>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">W&auml;hle unten eine echte Nachricht aus dem Channel, die diesem Format entspricht.</p>
              </div>

              {trainError && (
                <div className="mb-3 p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444" }}>
                  {trainError}
                </div>
              )}

              {loadingMessages ? (
                <div className="text-center py-8">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
                  <p className="text-xs text-zinc-500">Chat-Verlauf wird geladen...</p>
                </div>
              ) : channelMessages.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">Keine Nachrichten gefunden.</p>
              ) : (
                <>
                  <div className="text-[10px] text-zinc-600 mb-2">{channelMessages.length} Nachrichten geladen — gelb markierte sind vermutlich Signale</div>
                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                    {channelMessages.map(m => (
                      <button
                        key={m.id}
                        onClick={() => selectAndParse(selectedSignal === m.id ? null : m.id)}
                        className="w-full text-left p-3 rounded-lg transition-all text-sm"
                        style={{
                          background: selectedSignal === m.id ? "rgba(34,197,94,0.08)" : m.isSignal ? "rgba(250,239,112,0.04)" : "var(--gf-obsidian)",
                          border: selectedSignal === m.id ? "2px solid rgba(34,197,94,0.3)" : m.isSignal ? "1px solid rgba(250,239,112,0.1)" : "1px solid var(--gf-border)",
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {selectedSignal === m.id && <span className="text-emerald-400 flex-shrink-0 mt-0.5">&#10003;</span>}
                          {m.isSignal && selectedSignal !== m.id && <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ background: "rgba(250,239,112,0.1)", color: "var(--gf-gold)" }}>Signal?</span>}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-zinc-300 whitespace-pre-wrap break-words">{m.text}</div>
                            <div className="text-[9px] text-zinc-600 mt-1">{new Date(m.date).toLocaleString("de-DE")}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Step 2: Update-Nachricht auswählen (optional) */}
            {selectedSignal !== null && (
              <div className="gf-panel p-5">
                <div className="text-sm font-semibold text-white mb-1">Schritt 2: Update-Nachricht (optional)</div>
                <p className="text-xs text-zinc-500 mb-4">Gibt es eine Folge-Nachricht die SL/TP anpasst? Wenn ja, klicke darauf. Wenn nicht, überspringe diesen Schritt.</p>

                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {channelMessages.filter(m => m.id !== selectedSignal).map(m => (
                    <button
                      key={m.id}
                      onClick={() => selectUpdateAndParse(selectedUpdate === m.id ? null : m.id)}
                      className="w-full text-left p-3 rounded-lg transition-all text-sm"
                      style={{
                        background: selectedUpdate === m.id ? "rgba(59,130,246,0.08)" : "var(--gf-obsidian)",
                        border: selectedUpdate === m.id ? "2px solid rgba(59,130,246,0.3)" : "1px solid var(--gf-border)",
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {selectedUpdate === m.id && <span className="text-blue-400 flex-shrink-0 mt-0.5">✓</span>}
                        <div className="text-xs text-zinc-300 whitespace-pre-wrap break-words">{m.text}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Preview */}
            {selectedSignal !== null && (
              <div className="gf-panel p-5">
                <div className="text-sm font-semibold text-white mb-1">Schritt 3: So konvertiert die KI dein Signal</div>
                <p className="text-xs text-zinc-500 mb-4">Live-Vorschau — so wird das Signal interpretiert und als Trade ausgef&uuml;hrt.</p>

                {parsingPreview ? (
                  <div className="text-center py-4">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
                    <p className="text-xs text-zinc-500">KI analysiert Signal...</p>
                  </div>
                ) : parsedPreview ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-600">Aktion</div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: parsedPreview.action === "BUY" ? "#22c55e" : parsedPreview.action === "SELL" ? "#ef4444" : "var(--gf-gold)" }}>
                          {parsedPreview.action || "—"}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-600">Symbol</div>
                        <div className="text-sm font-bold text-white mt-0.5">{parsedPreview.symbol || "—"}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-600">Entry</div>
                        <div className="text-xs font-mono text-white mt-0.5">{parsedPreview.entryPrice ?? "Market"}</div>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-600">Stop Loss</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: parsedPreview.stopLoss ? "#ef4444" : "var(--gf-text-dim)" }}>
                          {parsedPreview.stopLoss ?? "—"}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-600">Take Profit</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: parsedPreview.takeProfits?.length ? "#22c55e" : "var(--gf-text-dim)" }}>
                          {parsedPreview.takeProfits?.length ? parsedPreview.takeProfits.join(" / ") : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: parsedPreview.confidence > 70 ? "#22c55e" : parsedPreview.confidence > 40 ? "#f59e0b" : "#ef4444" }} />
                        <span className="text-[10px] text-zinc-500">Konfidenz: {parsedPreview.confidence}%</span>
                      </div>
                      {parsedPreview.isModification && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>Modification</span>}
                      {parsedPreview.moveToBreakeven && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(250,239,112,0.1)", color: "var(--gf-gold)" }}>Breakeven</span>}
                    </div>
                    {parsedPreview.action === "UNKNOWN" && (
                      <div className="p-2.5 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)", color: "#ef4444" }}>
                        Die KI konnte kein Signal erkennen. W&auml;hle eine andere Nachricht oder f&uuml;ge die Update-Nachricht (SL/TP) dazu.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 text-center py-3">W&auml;hle ein Signal oben aus um die Vorschau zu sehen.</p>
                )}
              </div>
            )}

            {/* Save */}
            {selectedSignal !== null && parsedPreview && parsedPreview.action !== "UNKNOWN" && (
              <button onClick={saveTraining} disabled={trainSaving} className="gf-btn w-full">
                {trainSaving ? "Wird gespeichert..." : "Signal-Format speichern →"}
              </button>
            )}
            {selectedSignal !== null && parsedPreview && parsedPreview.action === "UNKNOWN" && (
              <p className="text-xs text-center text-zinc-600">W&auml;hle ein anderes Signal oder f&uuml;ge ein Update hinzu, damit die KI es erkennen kann.</p>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Connected Dashboard ─────────────────────────────
  if (connected && step === 1) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="gf-heading text-2xl">Telegram Copier</h1>
            <p className="text-sm text-zinc-500 mt-1">Signale aus Telegram-Channels automatisch kopieren</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(4)} className="gf-btn-outline gf-btn-sm">Channels verwalten</button>
            <button onClick={disconnect} className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">Trennen</button>
          </div>
        </div>

        {/* Status */}
        <div className="gf-panel p-5 flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px rgba(52,211,153,0.5)" }} />
          <div>
            <div className="text-sm font-semibold text-white">Telegram verbunden</div>
            <div className="text-xs text-zinc-500">{active.length} Channel{active.length !== 1 ? "s" : ""} aktiv</div>
          </div>
        </div>

        {/* Active Channels */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Aktive Channels</span>
            <button onClick={() => setStep(4)} className="text-xs text-[var(--gf-gold)] hover:underline">+ Channel hinzuf&uuml;gen</button>
          </div>
          {active.length === 0 ? (
            <div className="gf-panel p-8 text-center">
              <div className="text-3xl mb-3">{"\ud83d\udce1"}</div>
              <p className="text-sm text-zinc-400 mb-4">Noch keine Channels verbunden.</p>
              <button onClick={() => setStep(4)} className="gf-btn gf-btn-sm">Channel hinzuf&uuml;gen &rarr;</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {active.map(ch => (
                <div key={ch.id} className="gf-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: ch.status === "active" ? "var(--gf-green)" : "#666" }} />
                    <div>
                      <div className="text-sm font-semibold text-white">{ch.channelName || ch.channel_name || "Channel"}</div>
                      <div className="text-[10px] text-zinc-600">{ch.channelId || ch.channel_id || ch.id}</div>
                    </div>
                  </div>
                  <button onClick={() => removeChannel(ch.channelId)} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">Entfernen</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MT4/MT5 Konto verbinden */}
        <div className="gf-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Trading-Konto</div>
          </div>
          {/* Quick Demo */}
          <div className="mb-4 p-3 rounded-lg flex items-center justify-between" style={{ background: "rgba(250,239,112,0.04)", border: "1px solid rgba(250,239,112,0.1)" }}>
            <div>
              <div className="text-xs font-semibold text-white">Kein Konto? Demo starten</div>
              <div className="text-[10px] text-zinc-500">MetaApi Demo mit $10.000 — sofort bereit</div>
            </div>
            <button
              onClick={async () => {
                setMtConnecting(true); setMtResult(null);
                try {
                  const res = await fetch("/api/accounts/create-demo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ platform: mtPlatform }),
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    setMtResult({ ok: true, msg: `Demo-Konto erstellt: ${data.account.server} (${data.account.currency} ${data.account.balance})` });
                  } else {
                    setMtResult({ ok: false, msg: data.error || "Demo-Erstellung fehlgeschlagen" });
                  }
                } catch {
                  setMtResult({ ok: false, msg: "Netzwerkfehler. Bitte nochmal versuchen." });
                }
                setMtConnecting(false);
              }}
              disabled={mtConnecting}
              className="text-xs px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0"
              style={{ background: "var(--gf-gold)", color: "var(--gf-obsidian)" }}
            >
              {mtConnecting ? "Erstelle..." : "Demo erstellen"}
            </button>
          </div>

          {mtResult?.ok ? (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <span className="w-3 h-3 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.4)" }} />
              <div>
                <div className="text-sm font-semibold text-emerald-400">MT-Konto verbunden</div>
                <div className="text-xs text-zinc-500">{mtResult.msg}</div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-zinc-500 mb-4">Verbinde dein MetaTrader-Konto, damit die kopierten Signale dort ausgef&uuml;hrt werden.</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <select className="gf-input text-sm" value={mtPlatform} onChange={e => setMtPlatform(e.target.value)}>
                  <option value="mt4">MetaTrader 4</option>
                  <option value="mt5">MetaTrader 5</option>
                </select>
                <input className="gf-input text-sm" placeholder="Broker Server" value={mtBroker} onChange={e => setMtBroker(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className="gf-input text-sm" placeholder="Login / Kontonummer" value={mtLogin} onChange={e => setMtLogin(e.target.value)} />
                <input className="gf-input text-sm" type="password" placeholder="Investor-Passwort" value={mtPassword} onChange={e => setMtPassword(e.target.value)} />
              </div>
              <div className="flex items-start gap-2 mb-4 p-2.5 rounded-lg" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.08)" }}>
                <span className="text-xs flex-shrink-0">{"\ud83d\udd12"}</span>
                <span className="text-[10px] text-zinc-500">Read-Only Zugang (Investor-Passwort). Wir f&uuml;hren nur Trades des Copiers aus.</span>
              </div>
              <button
                onClick={async () => {
                  if (!mtLogin || !mtPassword) { setMtResult({ ok: false, msg: "Login und Passwort erforderlich" }); return; }
                  setMtConnecting(true);
                  setMtResult(null);
                  try {
                    const res = await fetch("/api/accounts/connect", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ login: mtLogin, password: mtPassword, broker: mtBroker, platform: mtPlatform }),
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      setMtResult({ ok: true, msg: `${mtPlatform.toUpperCase()} Login ${mtLogin} verbunden` });
                    } else {
                      setMtResult({ ok: false, msg: data.error || "Verbindung fehlgeschlagen. Prüfe deine Daten." });
                    }
                  } catch {
                    setMtResult({ ok: false, msg: "Netzwerkfehler. Bitte versuche es nochmal." });
                  }
                  setMtConnecting(false);
                }}
                disabled={mtConnecting || !mtLogin || !mtPassword}
                className="gf-btn w-full"
                style={{ opacity: !mtLogin || !mtPassword ? 0.4 : 1 }}
              >
                {mtConnecting ? "Verbinde..." : "MT-Konto verbinden"}
              </button>
              {mtResult && !mtResult.ok && (
                <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444" }}>{mtResult.msg}</div>
              )}
            </div>
          )}
        </div>

        {/* Smart Orders */}
        <div className="gf-panel p-5">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 mb-3">Smart Orders</div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "4-Split TP", icon: "\ud83c\udfaf" },
              { label: "Auto-Breakeven", icon: "\ud83d\udee1\ufe0f" },
              { label: "Trailing Runner", icon: "\ud83c\udfc3" },
              { label: "Risk Shield", icon: "\u26a1" },
            ].map(s => (
              <span key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(250,239,112,0.06)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.12)" }}>
                <span>{s.icon}</span> {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="gf-panel p-5">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 mb-3">So funktioniert es</div>
          <div className="space-y-3 text-sm text-zinc-400">
            <div className="flex items-start gap-3">
              <span className="text-[var(--gf-gold)]">1.</span>
              <span>Signal kommt in deinem Telegram-Channel an</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--gf-gold)]">2.</span>
              <span>KI parst das Signal automatisch (Symbol, Entry, SL, TP)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--gf-gold)]">3.</span>
              <span>Risk Shield pr&uuml;ft ob der Trade zu deinem Profil passt</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--gf-gold)]">4.</span>
              <span>Trade wird mit Smart Orders auf deinem MT4/MT5 ausgef&uuml;hrt</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Channel Management (Step 4 from dashboard) ──────
  if (connected && step === 4) {
    return (
      <div className="max-w-lg mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="gf-heading text-xl">Channels verwalten</h1>
          <button onClick={() => setStep(1)} className="text-xs text-zinc-500 hover:text-white">&larr; Zur&uuml;ck</button>
        </div>

        {/* Available channels from Telegram */}
        <div className="gf-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">Deine Telegram Channels</div>
            <button onClick={loadChannels} disabled={loadingChannels} className="text-xs text-[var(--gf-gold)] hover:underline">
              {loadingChannels ? "Lädt..." : "Aktualisieren"}
            </button>
          </div>
          {loadingChannels ? (
            <div className="text-center py-6">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
              <p className="text-xs text-zinc-500">Lade deine Channels...</p>
            </div>
          ) : available.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {available.filter(ch => !active.some(a => a.channelId === ch.id)).map(ch => (
                <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(250,239,112,0.06)", color: "var(--gf-gold)" }}>
                      {ch.type === "Channel" ? "\ud83d\udce2" : "\ud83d\udc65"}
                    </div>
                    <div>
                      <div className="text-sm text-white">{ch.title}</div>
                      <div className="text-[10px] text-zinc-600">{ch.type} &middot; {ch.id}</div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await api("/api/telegram/channels/add", { channelId: ch.id, channelName: ch.title });
                      await loadChannels();
                    }}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.12)" }}
                  >
                    Hinzufügen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 py-4 text-center">Keine Channels gefunden. Tritt zuerst Telegram-Channels bei.</p>
          )}
        </div>

        {/* Manual add (fallback) */}
        <details className="gf-panel">
          <summary className="p-4 cursor-pointer text-xs text-zinc-500 hover:text-zinc-400">Channel manuell hinzufügen (mit ID)</summary>
          <div className="px-4 pb-4 space-y-3">
            <input type="text" placeholder="Channel-ID (z.B. -1001234567890)" value={manualChannelId} onChange={e => setManualChannelId(e.target.value)} className="gf-input" />
            <input type="text" placeholder="Anzeigename (optional)" value={manualChannelName} onChange={e => setManualChannelName(e.target.value)} className="gf-input" />
            <button onClick={addChannel} disabled={loading || !manualChannelId} className="gf-btn w-full" style={{ opacity: !manualChannelId ? 0.4 : 1 }}>
              {loading ? "Wird hinzugefügt..." : "Hinzufügen"}
            </button>
          </div>
        </details>
        {error && <div className="p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444" }}>{error.message}</div>}

        {/* Existing channels */}
        {active.length > 0 && (
          <div className="gf-panel p-5">
            <div className="text-sm font-semibold text-white mb-3">Aktive Channels ({active.length})</div>
            <div className="space-y-2">
              {active.map(ch => {
                const name = ch.channelName || ch.channel_name || "Channel";
                const cid = ch.channelId || ch.channel_id || ch.id;
                return (
                <div key={ch.id} className="p-3 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.12)" }}>📢</div>
                      <div>
                        <div className="text-sm font-medium text-white">{name}</div>
                        <div className="text-[10px] text-zinc-600">{cid}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openTraining(cid, name)} className="text-xs px-2 py-1 rounded" style={{ background: "rgba(250,239,112,0.06)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.1)" }}>Trainieren</button>
                      <button onClick={() => removeChannel(cid)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                    </div>
                  </div>
                  {userAccounts.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--gf-border)" }}>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-600 flex-shrink-0">Konto:</span>
                      <select
                        className="gf-input text-xs !py-1"
                        defaultValue={(ch.settings as any)?.linkedAccountId || ""}
                        onChange={e => linkAccountToChannel(cid, e.target.value)}
                      >
                        <option value="">Automatisch (erstes aktives)</option>
                        {userAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.account_name} ({acc.mt_login})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="gf-panel p-4">
          <div className="text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-400">Tipp:</strong> Tritt in Telegram dem Signal-Channel bei, dann f&uuml;ge ihn hier hinzu. Der Copier h&ouml;rt automatisch auf neue Nachrichten und f&uuml;hrt erkannte Signale aus.
          </div>
        </div>
      </div>
    );
  }

  // ── Setup Wizard ────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <div className="text-center mb-2">
        <h1 className="gf-heading text-2xl">Telegram verbinden</h1>
        <p className="text-sm text-zinc-500 mt-2">Verbinde deinen Telegram-Account um Signale automatisch zu kopieren.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all" style={{
              background: step >= s ? "var(--gf-gold)" : "var(--gf-panel)",
              color: step >= s ? "var(--gf-obsidian)" : "var(--gf-text-dim)",
              border: `2px solid ${step >= s ? "var(--gf-gold)" : "var(--gf-border)"}`,
            }}>
              {step > s ? "\u2713" : s}
            </div>
            {s < 3 && <div className="w-8 h-px" style={{ background: step > s ? "var(--gf-gold)" : "var(--gf-border)" }} />}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <span className="text-red-400 flex-shrink-0">{"\u26a0\ufe0f"}</span>
          <div>
            <div className="text-sm text-red-300">{error.message}</div>
            {error.action && error.actionLabel && (
              <button onClick={() => handleErrorAction(error.action)} className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.15)" }}>
                {error.actionLabel} &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Phone */}
      {step === 1 && (
        <div className="gf-panel p-6">
          <div className="gf-eyebrow mb-3">{"\u25c6"} Schritt 1</div>
          <h2 className="text-lg font-bold text-white mb-2">Telefonnummer eingeben</h2>
          <p className="text-sm text-zinc-500 mb-6">Die Nummer, mit der du bei Telegram registriert bist. Du bekommst einen Best&auml;tigungscode in der Telegram-App.</p>

          <input
            type="tel" placeholder="+49 170 1234567" value={phone}
            onChange={e => setPhone(e.target.value)}
            className="gf-input mb-4 text-lg"
          />

          <button onClick={sendCode} disabled={loading || phone.length < 10} className="gf-btn w-full" style={{ opacity: phone.length < 10 ? 0.4 : 1 }}>
            {loading ? "Code wird gesendet..." : "Code senden →"}
          </button>

          <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(250,239,112,0.04)", border: "1px solid rgba(250,239,112,0.08)" }}>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              <strong className="text-zinc-400">{"\ud83d\udd12"} Sicher:</strong> Wir speichern deine Nummer verschl&uuml;sselt. Der Zugang wird nur f&uuml;r das Lesen von Signal-Channels verwendet. Wir senden niemals Nachrichten in deinem Namen.
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Code */}
      {step === 2 && (
        <div className="gf-panel p-6">
          <div className="gf-eyebrow mb-3">{"\u25c6"} Schritt 2</div>
          <h2 className="text-lg font-bold text-white mb-2">Code eingeben</h2>
          <p className="text-sm text-zinc-500 mb-2">&Ouml;ffne die <strong className="text-white">Telegram-App</strong> auf deinem Handy. Du hast eine Nachricht mit einem 5-stelligen Code bekommen.</p>
          <p className="text-xs text-zinc-600 mb-6">Gesendet an: <span className="text-zinc-400 font-mono">{phone}</span></p>

          <input
            type="text" placeholder="12345" value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            className="gf-input mb-4 text-center text-2xl tracking-[0.3em] font-mono"
            maxLength={6} autoFocus
          />

          {codeExpired && (
            <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444" }}>
              Der Code k&ouml;nnte abgelaufen sein ({Math.floor(codeAge / 60)}:{(codeAge % 60).toString().padStart(2, "0")} vergangen).
              <button onClick={resendCode} className="ml-2 text-[var(--gf-gold)] hover:underline">Neuen Code senden</button>
            </div>
          )}

          <button onClick={verifyCode} disabled={loading || code.length < 4} className="gf-btn w-full" style={{ opacity: code.length < 4 ? 0.4 : 1 }}>
            {loading ? "Wird verifiziert..." : "Verifizieren →"}
          </button>

          <div className="flex items-center justify-between mt-4">
            <button onClick={() => { setStep(1); setError(null); }} className="text-xs text-zinc-500 hover:text-white">&larr; Nummer &auml;ndern</button>
            <button onClick={resendCode} className="text-xs text-[var(--gf-gold)] hover:underline">Code erneut senden</button>
          </div>
        </div>
      )}

      {/* Step 3: 2FA */}
      {step === 3 && (
        <div className="gf-panel p-6">
          <div className="gf-eyebrow mb-3">{"\u25c6"} Schritt 3</div>
          <h2 className="text-lg font-bold text-white mb-2">2FA-Passwort</h2>
          <p className="text-sm text-zinc-500 mb-6">Dein Telegram-Account hat Zwei-Faktor-Authentifizierung aktiviert. Gib dein <strong className="text-white">Cloud-Passwort</strong> ein (das du in Telegram unter Einstellungen &rarr; Datenschutz &rarr; Zwei-Schritte-Verifizierung festgelegt hast).</p>

          <input
            type="password" placeholder="Cloud-Passwort" value={password}
            onChange={e => setPassword(e.target.value)}
            className="gf-input mb-4"
          />

          <button onClick={verify2FA} disabled={loading || !password} className="gf-btn w-full" style={{ opacity: !password ? 0.4 : 1 }}>
            {loading ? "Wird geprüft..." : "Bestätigen →"}
          </button>

          <button onClick={() => { setStep(1); setError(null); }} className="text-xs text-zinc-500 hover:text-white mt-4 block">&larr; Von vorne starten</button>
        </div>
      )}

      {/* Risikohinweis */}
      <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
        Risikohinweis: Trading birgt erhebliche Verlustrisiken.{" "}
        <Link href="/risk-disclaimer" className="underline hover:text-zinc-400">Mehr erfahren</Link>
      </p>
    </div>
  );
}
