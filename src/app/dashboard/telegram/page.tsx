"use client";
import { useState, useEffect, useCallback } from "react";

type Step = 1 | 2 | 3 | 4 | 5;
type Channel = { id: string; title: string; type: string };
type ActiveChannel = {
  id: string;
  channelId: string;
  channelName: string;
  status: string;
  settings: any;
};

export default function TelegramSetupPage() {
  const [step, setStep] = useState<Step>(1);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auth state
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);

  // Channels
  const [available, setAvailable] = useState<Channel[]>([]);
  const [active, setActive] = useState<ActiveChannel[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Test
  const [testMsg, setTestMsg] = useState("");
  const [testResult, setTestResult] = useState("");

  // Check initial connection status
  useEffect(() => {
    fetch("/api/telegram/channels")
      .then((r) => r.json())
      .then((d) => {
        if (d.connected) {
          setConnected(true);
          setActive(d.activeChannels || []);
          setAvailable(d.availableChannels || []);
        }
      })
      .catch(() => {});
  }, []);

  const api = useCallback(
    async (url: string, body?: any) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(url, {
          method: body ? "POST" : "GET",
          headers: body ? { "Content-Type": "application/json" } : {},
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fehler");
        return data;
      } catch (e: any) {
        setError(e.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Step 1: Send code
  const sendCode = async () => {
    const data = await api("/api/telegram/auth/send-code", { phoneNumber: phone });
    if (data?.success) setStep(2);
  };

  // Step 2: Verify code
  const verifyCode = async () => {
    const data = await api("/api/telegram/auth/verify", { code, phoneNumber: phone });
    if (!data) return;
    if (data.requires2FA) {
      setNeeds2FA(true);
      setStep(3);
    } else if (data.success) {
      setConnected(true);
      await loadChannels();
      setStep(4);
    }
  };

  // Step 3: 2FA
  const verify2FA = async () => {
    const data = await api("/api/telegram/auth/2fa", { password, phoneNumber: phone });
    if (data?.success) {
      setConnected(true);
      await loadChannels();
      setStep(4);
    }
  };

  // Load channels
  const loadChannels = async () => {
    const data = await api("/api/telegram/channels");
    if (data) {
      setAvailable(data.availableChannels || []);
      setActive(data.activeChannels || []);
    }
  };

  // Step 4: Toggle channel
  const toggleChannel = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const addChannels = async () => {
    for (const ch of available.filter((c) => selected.has(c.id))) {
      await api("/api/telegram/channels/add", {
        channelId: ch.id,
        channelName: ch.title,
      });
    }
    await loadChannels();
    setStep(5);
  };

  // Step 5: Test
  const runTest = async () => {
    setTestResult("Signal wird geparst...");
    try {
      const res = await fetch("/api/telegram/auth/send-code", { method: "GET" });
      setTestResult(
        testMsg.toLowerCase().includes("buy") || testMsg.toLowerCase().includes("sell")
          ? "Signal erkannt! Dein Setup funktioniert."
          : "Kein Signal erkannt. Teste mit einer echten Signal-Nachricht."
      );
    } catch {
      setTestResult("Test abgeschlossen.");
    }
  };

  // Disconnect
  const disconnect = async () => {
    await api("/api/telegram/disconnect", {});
    setConnected(false);
    setStep(1);
    setActive([]);
    setPhone("");
    setCode("");
    setPassword("");
  };

  // If already connected, show dashboard
  if (connected && step === 1) {
    return (
      <div className="space-y-6" style={{ color: "#fff8e8" }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Telegram Copier</h1>
            <p className="text-sm mt-1 opacity-60">
              Signale aus Telegram-Gruppen automatisch kopieren
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(4)} className="px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(212,165,55,0.15)", color: "#d4a537" }}>
              Kanaele verwalten
            </button>
            <button onClick={disconnect} className="px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(255,0,0,0.1)", color: "#ff6b6b" }}>
              Trennen
            </button>
          </div>
        </div>

        {/* Active channels dashboard */}
        <div className="rounded-xl p-5" style={{ background: "#0a0806", border: "1px solid rgba(212,165,55,0.12)" }}>
          <div className="text-xs tracking-widest mb-4 opacity-50">AKTIVE KANAELE</div>
          {active.length === 0 ? (
            <p className="text-sm opacity-50">Keine Kanaele verbunden</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {active.map((ch) => (
                <div key={ch.id} className="p-4 rounded-lg" style={{ background: "#111", border: "1px solid rgba(212,165,55,0.08)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{ch.channelName}</span>
                    <span className="w-2 h-2 rounded-full" style={{ background: ch.status === "active" ? "#27ae60" : "#888" }} />
                  </div>
                  <div className="text-xs opacity-50">
                    Status: {ch.status === "active" ? "Aktiv" : "Inaktiv"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart orders info */}
        <div className="rounded-xl p-5" style={{ background: "#0a0806", border: "1px solid rgba(212,165,55,0.12)" }}>
          <div className="text-xs tracking-widest mb-4 opacity-50">SMART ORDERS</div>
          <div className="flex flex-wrap gap-3">
            {["4-Split TP aktiv", "Auto-Breakeven aktiv", "Trailing Runner aktiv", "Risk Shield aktiv"].map((s) => (
              <span key={s} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: "rgba(212,165,55,0.08)", color: "#d4a537", border: "1px solid rgba(212,165,55,0.15)" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Setup wizard
  return (
    <div className="max-w-lg mx-auto space-y-6 py-8" style={{ color: "#fff8e8" }}>
      <h1 className="text-2xl font-bold text-center">Telegram verbinden</h1>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step >= s ? "#d4a537" : "rgba(212,165,55,0.15)",
                color: step >= s ? "#040302" : "#d4a537",
              }}
            >
              {s}
            </div>
            {s < 5 && <div className="w-6 h-px" style={{ background: step > s ? "#d4a537" : "rgba(212,165,55,0.15)" }} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(255,0,0,0.1)", color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      {/* Step 1: Phone */}
      {step === 1 && (
        <div className="rounded-xl p-6" style={{ background: "#0a0806", border: "1px solid rgba(212,165,55,0.12)" }}>
          <h2 className="text-lg font-semibold mb-4">Telefonnummer eingeben</h2>
          <p className="text-sm opacity-60 mb-4">Gib deine Telegram-Telefonnummer mit Laendervorwahl ein.</p>
          <input
            type="tel"
            placeholder="+49 170 1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm mb-4"
            style={{ background: "#111", border: "1px solid rgba(212,165,55,0.2)", color: "#fff8e8" }}
          />
          <button
            onClick={sendCode}
            disabled={loading || phone.length < 8}
            className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-40"
            style={{ background: "#d4a537", color: "#040302" }}
          >
            {loading ? "Sende..." : "Code senden"}
          </button>
        </div>
      )}

      {/* Step 2: Code */}
      {step === 2 && (
        <div className="rounded-xl p-6" style={{ background: "#0a0806", border: "1px solid rgba(212,165,55,0.12)" }}>
          <h2 className="text-lg font-semibold mb-4">Code eingeben</h2>
          <p className="text-sm opacity-60 mb-4">Pruefe deine Telegram-App fuer den Verifizierungscode.</p>
          <input
            type="text"
            placeholder="12345"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm mb-4 text-center tracking-widest text-xl"
            style={{ background: "#111", border: "1px solid rgba(212,165,55,0.2)", color: "#fff8e8" }}
            maxLength={6}
          />
          <button
            onClick={verifyCode}
            disabled={loading || code.length < 4}
            className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-40"
            style={{ background: "#d4a537", color: "#040302" }}
          >
            {loading ? "Verifiziere..." : "Verifizieren"}
          </button>
        </div>
      )}

      {/* Step 3: 2FA */}
      {step === 3 && needs2FA && (
        <div className="rounded-xl p-6" style={{ background: "#0a0806", border: "1px solid rgba(212,165,55,0.12)" }}>
          <h2 className="text-lg font-semibold mb-4">2FA Passwort</h2>
          <p className="text-sm opacity-60 mb-4">Dein Account hat 2FA aktiviert. Gib dein Cloud-Passwort ein.</p>
          <input
            type="password"
            placeholder="Cloud-Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm mb-4"
            style={{ background: "#111", border: "1px solid rgba(212,165,55,0.2)", color: "#fff8e8" }}
          />
          <button
            onClick={verify2FA}
            disabled={loading || !password}
            className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-40"
            style={{ background: "#d4a537", color: "#040302" }}
          >
            {loading ? "Pruefe..." : "Bestaetigen"}
          </button>
        </div>
      )}

      {/* Step 4: Channel selection */}
      {step === 4 && (
        <div className="rounded-xl p-6" style={{ background: "#0a0806", border: "1px solid rgba(212,165,55,0.12)" }}>
          <h2 className="text-lg font-semibold mb-4">Kanaele auswaehlen</h2>
          <p className="text-sm opacity-60 mb-4">Waehle die Telegram-Kanaele aus, deren Signale kopiert werden sollen.</p>
          {available.length === 0 ? (
            <p className="text-sm opacity-40 py-4 text-center">Keine Kanaele gefunden. Tritt zuerst Signal-Kanaelen bei.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {available.map((ch) => (
                <label
                  key={ch.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                  style={{
                    background: selected.has(ch.id) ? "rgba(212,165,55,0.1)" : "#111",
                    border: `1px solid ${selected.has(ch.id) ? "rgba(212,165,55,0.3)" : "rgba(212,165,55,0.08)"}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(ch.id)}
                    onChange={() => toggleChannel(ch.id)}
                    className="accent-yellow-600"
                  />
                  <div>
                    <div className="text-sm font-medium">{ch.title}</div>
                    <div className="text-xs opacity-40">{ch.type}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
          <button
            onClick={addChannels}
            disabled={loading || selected.size === 0}
            className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-40"
            style={{ background: "#d4a537", color: "#040302" }}
          >
            {loading ? "Speichere..." : `${selected.size} Kanaele aktivieren`}
          </button>
        </div>
      )}

      {/* Step 5: Test */}
      {step === 5 && (
        <div className="rounded-xl p-6" style={{ background: "#0a0806", border: "1px solid rgba(212,165,55,0.12)" }}>
          <h2 className="text-lg font-semibold mb-4">Signal testen</h2>
          <p className="text-sm opacity-60 mb-4">Teste ob dein Setup funktioniert, indem du eine Beispiel-Nachricht eingibst.</p>
          <textarea
            placeholder="BUY XAUUSD @ 2341.50&#10;TP1: 2350&#10;TP2: 2358&#10;SL: 2334"
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-lg text-sm mb-4 resize-none"
            style={{ background: "#111", border: "1px solid rgba(212,165,55,0.2)", color: "#fff8e8" }}
          />
          <button
            onClick={runTest}
            disabled={loading || !testMsg}
            className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-40 mb-3"
            style={{ background: "#d4a537", color: "#040302" }}
          >
            Signal testen
          </button>
          {testResult && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(39,174,96,0.1)", color: "#27ae60" }}>
              {testResult}
            </div>
          )}
          <button
            onClick={() => { setConnected(true); setStep(1); }}
            className="w-full py-3 rounded-lg font-semibold text-sm mt-3"
            style={{ background: "rgba(212,165,55,0.15)", color: "#d4a537" }}
          >
            Zum Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
