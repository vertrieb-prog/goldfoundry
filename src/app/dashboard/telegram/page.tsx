"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4 | 5;
type ActiveChannel = { id: string; channelId: string; channelName: string; status: string; settings: any };

const ERROR_MAP: Record<string, string> = {
  "PHONE_CODE_EXPIRED": "Der Code ist abgelaufen. Klicke unten auf \"Code erneut senden\".",
  "PHONE_CODE_INVALID": "Falscher Code. Pr\u00fcfe die Telegram-App und versuche es nochmal.",
  "PHONE_NUMBER_INVALID": "Ung\u00fcltige Telefonnummer. Format: +49 170 1234567",
  "PHONE_NUMBER_BANNED": "Diese Nummer ist bei Telegram gesperrt.",
  "SESSION_PASSWORD_NEEDED": "Dein Account hat 2FA aktiviert. Gib dein Cloud-Passwort ein.",
  "PASSWORD_HASH_INVALID": "Falsches 2FA-Passwort. Versuche es nochmal.",
  "Nicht eingeloggt": "Bitte logge dich zuerst ein.",
  "Telegram Modul nicht verfuegbar": "Telegram-Verbindung wird eingerichtet. Bitte versuche es in 1 Minute nochmal.",
  "Telegram API nicht konfiguriert": "Telegram ist noch nicht konfiguriert. Kontaktiere den Support.",
};

function friendlyError(raw: string): string {
  for (const [key, msg] of Object.entries(ERROR_MAP)) {
    if (raw.includes(key)) return msg;
  }
  return raw;
}

export default function TelegramPage() {
  const [step, setStep] = useState<Step>(1);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codeSentAt, setCodeSentAt] = useState(0);

  const [active, setActive] = useState<ActiveChannel[]>([]);
  const [manualChannelId, setManualChannelId] = useState("");
  const [manualChannelName, setManualChannelName] = useState("");

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
    setError("");
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

  // Step 1: Send code
  const sendCode = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned.startsWith("+") || cleaned.length < 10) {
      setError("Bitte gib deine Nummer mit L\u00e4ndervorwahl ein, z.B. +49 170 1234567");
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
    if (code.length < 4) { setError("Bitte gib den vollst\u00e4ndigen Code ein (5 Ziffern)."); return; }
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
    setError("");
    const cleaned = phone.replace(/\s/g, "");
    const data = await api("/api/telegram/auth/send-code", { phoneNumber: cleaned });
    if (data?.success) {
      setCodeSentAt(Date.now());
      setStep(2);
    }
  };

  // Load channels
  const loadChannels = async () => {
    const data = await api("/api/telegram/channels");
    if (data) setActive(data.activeChannels || []);
  };

  // Add channel manually
  const addChannel = async () => {
    if (!manualChannelId) { setError("Bitte gib eine Channel-ID oder einen @username ein."); return; }
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

  // Remove channel
  const removeChannel = async (channelId: string) => {
    await fetch("/api/telegram/channels/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId }),
    });
    await loadChannels();
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

  const codeAge = codeSentAt ? Math.floor((Date.now() - codeSentAt) / 1000) : 0;
  const codeExpired = codeAge > 120;

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
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
            <span className="text-[9px] tracking-[2px] uppercase font-mono text-zinc-500">Aktive Channels</span>
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
                      <div className="text-sm font-semibold text-white">{ch.channelName}</div>
                      <div className="text-[10px] text-zinc-600 font-mono">{ch.channelId}</div>
                    </div>
                  </div>
                  <button onClick={() => removeChannel(ch.channelId)} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">Entfernen</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Orders */}
        <div className="gf-panel p-5">
          <div className="text-[9px] tracking-[2px] uppercase font-mono text-zinc-500 mb-3">Smart Orders</div>
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
          <div className="text-[9px] tracking-[2px] uppercase font-mono text-zinc-500 mb-3">So funktioniert es</div>
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

        {/* Add channel */}
        <div className="gf-panel p-5">
          <div className="text-sm font-semibold text-white mb-3">Channel hinzuf&uuml;gen</div>
          <p className="text-xs text-zinc-500 mb-4">Gib die Channel-ID oder den @username ein. Du musst dem Channel bereits in Telegram beigetreten sein.</p>
          <div className="space-y-3">
            <input
              type="text" placeholder="@channelname oder Channel-ID"
              value={manualChannelId} onChange={e => setManualChannelId(e.target.value)}
              className="gf-input"
            />
            <input
              type="text" placeholder="Anzeigename (optional)"
              value={manualChannelName} onChange={e => setManualChannelName(e.target.value)}
              className="gf-input"
            />
            <button onClick={addChannel} disabled={loading || !manualChannelId} className="gf-btn w-full" style={{ opacity: !manualChannelId ? 0.4 : 1 }}>
              {loading ? "Wird hinzugef\u00fcgt..." : "Channel hinzuf\u00fcgen"}
            </button>
          </div>
          {error && <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444" }}>{error}</div>}
        </div>

        {/* Existing channels */}
        {active.length > 0 && (
          <div className="gf-panel p-5">
            <div className="text-sm font-semibold text-white mb-3">Aktive Channels ({active.length})</div>
            <div className="space-y-2">
              {active.map(ch => (
                <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                  <div>
                    <div className="text-sm text-white">{ch.channelName}</div>
                    <div className="text-[10px] text-zinc-600 font-mono">{ch.channelId}</div>
                  </div>
                  <button onClick={() => removeChannel(ch.channelId)} className="text-xs text-red-400 hover:underline">Entfernen</button>
                </div>
              ))}
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
            <div className="text-sm text-red-400">{error}</div>
            {error.includes("abgelaufen") && (
              <button onClick={resendCode} className="text-xs text-[var(--gf-gold)] hover:underline mt-2">Code erneut senden &rarr;</button>
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
            {loading ? "Code wird gesendet..." : "Code senden \u2192"}
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
            {loading ? "Wird verifiziert..." : "Verifizieren \u2192"}
          </button>

          <div className="flex items-center justify-between mt-4">
            <button onClick={() => { setStep(1); setError(""); }} className="text-xs text-zinc-500 hover:text-white">&larr; Nummer &auml;ndern</button>
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
            {loading ? "Wird gepr\u00fcft..." : "Best\u00e4tigen \u2192"}
          </button>

          <button onClick={() => { setStep(1); setError(""); }} className="text-xs text-zinc-500 hover:text-white mt-4 block">&larr; Von vorne starten</button>
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
