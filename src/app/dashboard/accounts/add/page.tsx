// src/app/dashboard/accounts/add/page.tsx — Add MT4/MT5 Tracking Account
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FeatureGate from "@/components/FeatureGate";

interface BrokerServer {
  name: string;
  platform: string;
}

export default function AddAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [platform, setPlatform] = useState<"mt4" | "mt5">("mt4");
  const [brokerQuery, setBrokerQuery] = useState("");
  const [servers, setServers] = useState<BrokerServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [customServer, setCustomServer] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [allowCustom, setAllowCustom] = useState(true);
  const [accountName, setAccountName] = useState("");
  const [mtLogin, setMtLogin] = useState("");
  const [mtPassword, setMtPassword] = useState("");

  // Connection state
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Broker server search with debounce
  const searchBrokers = useCallback((query: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) {
      setServers([]);
      setShowDropdown(false);
      setSearchMessage("");
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/brokers/search?q=${encodeURIComponent(query)}&platform=${platform}`
        );
        const data = await res.json();
        setServers(data.servers ?? []);
        setAllowCustom(data.allowCustom ?? true);
        setSearchMessage(data.message ?? "");
        setShowDropdown(true);
      } catch {
        setServers([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [platform]);

  function selectServer(s: BrokerServer) {
    setSelectedServer(s.name);
    setBrokerQuery(s.name);
    setCustomServer(false);
    setShowDropdown(false);
  }

  function useCustomServer() {
    setSelectedServer(brokerQuery.trim());
    setCustomServer(true);
    setShowDropdown(false);
  }

  async function handleConnect() {
    setError("");
    setConnecting(true);
    setStatusMsg("Verbinde mit MetaTrader...");

    try {
      setStatusMsg("Account wird in der Cloud erstellt...");
      const res = await fetch("/api/accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: accountName || undefined,
          brokerServer: selectedServer,
          mtLogin,
          mtPassword,
          platform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verbindung fehlgeschlagen");
        setConnecting(false);
        setStatusMsg("");
        return;
      }

      setStatusMsg("Synchronisiert! Account bereit.");
      setSuccess(data.account);
      setStep(3);
    } catch (err) {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setConnecting(false);
    }
  }

  const canProceedStep1 = selectedServer.length > 0 && platform;
  const canProceedStep2 = mtLogin && mtPassword;

  return (
    <FeatureGate minTier="copier" featureName="Konto verbinden" landingPage="/">
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/accounts"
          className="text-xs mb-3 inline-block transition-colors hover:text-[var(--gf-gold)]"
          style={{ color: "var(--gf-text-dim)" }}
        >
          &larr; Zur&uuml;ck zu Accounts
        </Link>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--gf-text-bright)" }}
        >
          MT-Konto verbinden
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>
          Verbinde dein MetaTrader 4 oder 5 Konto f&uuml;r Live-Tracking
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
              style={{
                background:
                  step >= s
                    ? "linear-gradient(135deg, #d4a537, #b8891f)"
                    : "rgba(255,255,255,0.05)",
                color: step >= s ? "#0b0b0b" : "var(--gf-text-dim)",
              }}
            >
              {step > s ? "✓" : s}
            </div>
            <span
              className="text-xs hidden sm:block"
              style={{
                color:
                  step >= s ? "var(--gf-text-bright)" : "var(--gf-text-dim)",
              }}
            >
              {s === 1
                ? "Broker wählen"
                : s === 2
                  ? "Login-Daten"
                  : "Fertig"}
            </span>
            {s < 3 && (
              <div
                className="w-8 h-px mx-1"
                style={{
                  background:
                    step > s ? "var(--gf-gold)" : "rgba(255,255,255,0.06)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Platform & Broker */}
      {step === 1 && (
        <div className="gf-panel p-6 animate-in">
          {/* Platform Toggle */}
          <label
            className="block text-xs font-medium mb-2 uppercase tracking-wider"
            style={{ color: "var(--gf-text-dim)" }}
          >
            Plattform
          </label>
          <div className="flex gap-2 mb-6">
            {(["mt4", "mt5"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlatform(p);
                  setSelectedServer("");
                  setBrokerQuery("");
                  setServers([]);
                  setCustomServer(false);
                  setSearchMessage("");
                }}
                className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background:
                    platform === p
                      ? "rgba(212,165,55,0.1)"
                      : "rgba(255,255,255,0.03)",
                  border: `1px solid ${platform === p ? "rgba(212,165,55,0.3)" : "rgba(255,255,255,0.06)"}`,
                  color:
                    platform === p ? "var(--gf-gold)" : "var(--gf-text-dim)",
                }}
              >
                MetaTrader {p === "mt4" ? "4" : "5"}
              </button>
            ))}
          </div>

          {/* Broker Server Search */}
          <label
            className="block text-xs font-medium mb-2 uppercase tracking-wider"
            style={{ color: "var(--gf-text-dim)" }}
          >
            Broker Server
          </label>
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              className="gf-input"
              placeholder="Broker suchen... (z.B. ICMarkets, Pepperstone, Vantage)"
              value={brokerQuery}
              onChange={(e) => {
                setBrokerQuery(e.target.value);
                setSelectedServer("");
                setCustomServer(false);
                searchBrokers(e.target.value);
              }}
              onFocus={() => {
                if (servers.length > 0) setShowDropdown(true);
              }}
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{
                    borderColor: "var(--gf-gold)",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            )}

            {/* Server Dropdown */}
            {showDropdown && (servers.length > 0 || (brokerQuery.length >= 2 && !searchLoading)) && (
              <div
                className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg overflow-hidden max-h-60 overflow-y-auto"
                style={{
                  background: "var(--gf-panel)",
                  border: "1px solid var(--gf-border-active)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                }}
              >
                {servers.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectServer(s)}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/[0.03] flex items-center justify-between"
                    style={{
                      borderBottom:
                        i < servers.length - 1
                          ? "1px solid rgba(255,255,255,0.03)"
                          : undefined,
                    }}
                  >
                    <div>
                      <div style={{ color: "var(--gf-text-bright)" }}>
                        {s.name}
                      </div>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "rgba(212,165,55,0.08)",
                        color: "var(--gf-gold)",
                      }}
                    >
                      {(s.platform || platform).toUpperCase()}
                    </span>
                  </button>
                ))}

                {/* Custom server option */}
                {allowCustom && brokerQuery.trim().length >= 2 && (
                  <button
                    onClick={useCustomServer}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/[0.03] flex items-center justify-between"
                    style={{
                      borderTop: servers.length > 0 ? "1px solid rgba(212,165,55,0.15)" : undefined,
                    }}
                  >
                    <div>
                      <div style={{ color: "var(--gf-gold)" }}>
                        &quot;{brokerQuery.trim()}&quot; manuell verwenden
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "var(--gf-text-dim)" }}
                      >
                        Server nicht in der Liste? Namen direkt eingeben.
                      </div>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "rgba(212,165,55,0.08)",
                        color: "var(--gf-gold)",
                      }}
                    >
                      CUSTOM
                    </span>
                  </button>
                )}

                {/* No results message */}
                {servers.length === 0 && !allowCustom && searchMessage && (
                  <div
                    className="px-4 py-3 text-sm text-center"
                    style={{ color: "var(--gf-text-dim)" }}
                  >
                    {searchMessage}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected server confirmation */}
          {selectedServer && (
            <div
              className="mt-3 p-3 rounded-lg flex items-center gap-3"
              style={{
                background: "rgba(39,174,96,0.06)",
                border: "1px solid rgba(39,174,96,0.15)",
              }}
            >
              <span style={{ color: "var(--gf-green)" }}>{"✓"}</span>
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--gf-text-bright)" }}
                >
                  {selectedServer}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--gf-text-dim)" }}
                >
                  {customServer ? "Manuell eingegeben" : "Aus Serverliste"} &middot;{" "}
                  {platform.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Account Name (optional) */}
          <label
            className="block text-xs font-medium mb-2 mt-6 uppercase tracking-wider"
            style={{ color: "var(--gf-text-dim)" }}
          >
            Account Name <span className="normal-case">(optional)</span>
          </label>
          <input
            type="text"
            className="gf-input"
            placeholder="z.B. Mein ICMarkets Live"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />

          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="gf-btn w-full mt-6"
            style={{ opacity: canProceedStep1 ? 1 : 0.4 }}
          >
            Weiter &rarr;
          </button>
        </div>
      )}

      {/* Step 2: Credentials */}
      {step === 2 && (
        <div className="gf-panel p-6 animate-in">
          <div
            className="p-3 rounded-lg mb-6 flex items-center gap-3"
            style={{
              background: "rgba(212,165,55,0.04)",
              border: "1px solid rgba(212,165,55,0.1)",
            }}
          >
            <span className="text-lg">{"🔒"}</span>
            <div
              className="text-xs"
              style={{ color: "var(--gf-text)" }}
            >
              Wir nutzen nur Lese-Zugriff (Investor-Passwort). Es werden{" "}
              <strong style={{ color: "var(--gf-text-bright)" }}>
                KEINE Trades ausgef&uuml;hrt
              </strong>
              .
            </div>
          </div>

          {/* Selected Server Info */}
          <div
            className="p-3 rounded-lg mb-6 flex items-center gap-3"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="gf-icon-ring text-xs">
              {platform === "mt5" ? "5" : "4"}
            </div>
            <div>
              <div
                className="text-sm font-medium"
                style={{ color: "var(--gf-text-bright)" }}
              >
                {selectedServer}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--gf-text-dim)" }}
              >
                {customServer ? "Manuell eingegeben" : "Aus Serverliste"} &middot;{" "}
                {platform.toUpperCase()}
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="ml-auto text-xs underline"
              style={{ color: "var(--gf-text-dim)" }}
            >
              &Auml;ndern
            </button>
          </div>

          {/* Login */}
          <label
            className="block text-xs font-medium mb-2 uppercase tracking-wider"
            style={{ color: "var(--gf-text-dim)" }}
          >
            Account Login (Kontonummer)
          </label>
          <input
            type="text"
            className="gf-input mb-4"
            placeholder="z.B. 12345678"
            value={mtLogin}
            onChange={(e) => setMtLogin(e.target.value.replace(/\D/g, ""))}
          />

          {/* Password */}
          <label
            className="block text-xs font-medium mb-2 uppercase tracking-wider"
            style={{ color: "var(--gf-text-dim)" }}
          >
            Investor-Passwort (Read-Only)
          </label>
          <input
            type="password"
            className="gf-input mb-2"
            placeholder="Investor-Passwort eingeben"
            value={mtPassword}
            onChange={(e) => setMtPassword(e.target.value)}
          />
          <p
            className="text-[10px] mb-6"
            style={{ color: "var(--gf-text-dim)" }}
          >
            Das Investor-Passwort findest du in deinem MT4/MT5 unter Datei &rarr;
            Konto &rarr; Kontoeinstellungen
          </p>

          {/* Error */}
          {error && (
            <div
              className="p-3 rounded-lg mb-4 text-sm"
              style={{
                background: "rgba(192,57,43,0.08)",
                border: "1px solid rgba(192,57,43,0.2)",
                color: "var(--gf-red)",
              }}
            >
              {error}
            </div>
          )}

          {/* Status */}
          {statusMsg && !error && (
            <div
              className="p-3 rounded-lg mb-4 text-sm flex items-center gap-2"
              style={{
                background: "rgba(212,165,55,0.04)",
                border: "1px solid rgba(212,165,55,0.1)",
                color: "var(--gf-gold)",
              }}
            >
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{
                  borderColor: "var(--gf-gold)",
                  borderTopColor: "transparent",
                }}
              />
              {statusMsg}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep(1);
                setError("");
              }}
              className="gf-btn-outline flex-1"
              disabled={connecting}
            >
              &larr; Zur&uuml;ck
            </button>
            <button
              onClick={handleConnect}
              disabled={!canProceedStep2 || connecting}
              className="gf-btn flex-1"
              style={{
                opacity: canProceedStep2 && !connecting ? 1 : 0.4,
              }}
            >
              {connecting ? "Verbinde..." : "Konto verbinden"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && success && (
        <div className="gf-panel p-6 text-center animate-in">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "rgba(39,174,96,0.1)",
              border: "1px solid rgba(39,174,96,0.2)",
            }}
          >
            <span className="text-3xl">{"✓"}</span>
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "var(--gf-text-bright)" }}
          >
            Konto verbunden!
          </h2>
          <p className="mb-6" style={{ color: "var(--gf-text-dim)" }}>
            Dein MT{platform === "mt5" ? "5" : "4"}-Konto wird jetzt live
            getrackt.
          </p>

          {/* Account Info */}
          <div
            className="p-4 rounded-lg mb-6 text-left"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: "var(--gf-text-dim)" }}
                >
                  Server
                </div>
                <div
                  className="mono"
                  style={{ color: "var(--gf-text-bright)" }}
                >
                  {success.server}
                </div>
              </div>
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: "var(--gf-text-dim)" }}
                >
                  Login
                </div>
                <div
                  className="mono"
                  style={{ color: "var(--gf-text-bright)" }}
                >
                  #{success.login}
                </div>
              </div>
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: "var(--gf-text-dim)" }}
                >
                  Balance
                </div>
                <div
                  className="mono font-semibold"
                  style={{ color: "var(--gf-gold)" }}
                >
                  {Number(success.balance).toLocaleString("de-DE")}{" "}
                  {success.currency}
                </div>
              </div>
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: "var(--gf-text-dim)" }}
                >
                  Equity
                </div>
                <div
                  className="mono font-semibold"
                  style={{ color: "var(--gf-text-bright)" }}
                >
                  {Number(success.equity).toLocaleString("de-DE")}{" "}
                  {success.currency}
                </div>
              </div>
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: "var(--gf-text-dim)" }}
                >
                  Leverage
                </div>
                <div
                  className="mono"
                  style={{ color: "var(--gf-text-bright)" }}
                >
                  1:{success.leverage}
                </div>
              </div>
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: "var(--gf-text-dim)" }}
                >
                  Plattform
                </div>
                <div
                  className="mono"
                  style={{ color: "var(--gf-text-bright)" }}
                >
                  {platform.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/accounts"
              className="gf-btn-outline flex-1 text-center"
            >
              Alle Konten
            </Link>
            <button
              onClick={() => {
                setStep(1);
                setSelectedServer("");
                setBrokerQuery("");
                setMtLogin("");
                setMtPassword("");
                setAccountName("");
                setSuccess(null);
                setError("");
                setCustomServer(false);
              }}
              className="gf-btn flex-1"
            >
              Weiteres Konto +
            </button>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div
        className="mt-6 p-4 rounded-lg"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <h3
          className="text-xs font-semibold mb-2"
          style={{ color: "var(--gf-text-bright)" }}
        >
          Wie funktioniert das?
        </h3>
        <ol
          className="text-xs space-y-1.5"
          style={{ color: "var(--gf-text-dim)" }}
        >
          <li>
            <span className="mono" style={{ color: "var(--gf-gold)" }}>
              1.
            </span>{" "}
            W&auml;hle deinen Broker und Server aus der Liste
          </li>
          <li>
            <span className="mono" style={{ color: "var(--gf-gold)" }}>
              2.
            </span>{" "}
            Gib dein <strong>Investor-Passwort</strong> ein (Read-Only Zugang)
          </li>
          <li>
            <span className="mono" style={{ color: "var(--gf-gold)" }}>
              3.
            </span>{" "}
            Wir verbinden dein Konto &uuml;ber MetaApi Cloud
          </li>
          <li>
            <span className="mono" style={{ color: "var(--gf-gold)" }}>
              4.
            </span>{" "}
            Deine Trades, Equity &amp; Performance werden live getrackt
          </li>
        </ol>
        <p
          className="text-[10px] mt-3"
          style={{ color: "var(--gf-text-dim)" }}
        >
          {"🔒"} Wir nutzen nur Lese-Zugriff (Investor-Passwort). Es werden
          KEINE Trades ausgef&uuml;hrt.
        </p>
      </div>
    </div>
    </FeatureGate>
  );
}
