"use client";
import { useState, useEffect } from "react";

interface EngineEvent {
  id: string;
  pair_name: string;
  symbol: string;
  direction: string;
  volume: number;
  open_price: number;
  status: string;
  block_reason: string | null;
  error_message: string | null;
  latency_ms: number;
  created_at: string;
}

interface HealthPair {
  name: string;
  healthy: boolean;
  lastEvent: string;
  copied: number;
  blocked: number;
  missed: number;
}

interface HealthData {
  pairs: HealthPair[];
  alerts: string[];
  lastCheck: string;
  healthy: boolean;
}

interface Summary {
  detected: number;
  copied: number;
  blocked: number;
  missed: number;
  errors: number;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    DETECTED: { bg: "#4a4a6a", text: "#fff" },
    COPIED: { bg: "#00e6a0", text: "#0f0f1e" },
    BLOCKED: { bg: "#d4a537", text: "#0f0f1e" },
    MISSED: { bg: "#ff5045", text: "#fff" },
    CLOSED: { bg: "#6a6a8a", text: "#fff" },
    ERROR: { bg: "transparent", text: "#ff5045" },
  };
  const c = colors[status] || colors.DETECTED;
  return (
    <span style={{
      background: c.bg, color: c.text, padding: "2px 8px", borderRadius: "4px",
      fontSize: "12px", fontWeight: status === "MISSED" ? "bold" : "normal",
      border: status === "ERROR" ? "1px solid #ff5045" : "none",
    }}>
      {status}
    </span>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "#0f0f1e", border: "1px solid #2a2a4a", borderRadius: "12px", padding: "16px", textAlign: "center", flex: 1, minWidth: "120px" }}>
      <div style={{ fontSize: "24px", fontWeight: "bold", color, fontFamily: "monospace" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

export default function EngineMonitorPage() {
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [summary, setSummary] = useState<Summary>({ detected: 0, copied: 0, blocked: 0, missed: 0, errors: 0 });
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const fetchData = async () => {
    try {
      const [eventsRes, healthRes] = await Promise.all([
        fetch("/api/engine/events?limit=50"),
        fetch("/api/engine/health"),
      ]);
      const eventsData = await eventsRes.json();
      const healthData = await healthRes.json();
      setEvents(eventsData.events || []);
      setSummary(eventsData.summary || { detected: 0, copied: 0, blocked: 0, missed: 0, errors: 0 });
      setHealth(healthData);
      setLastRefresh(new Date().toLocaleTimeString("de-DE"));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.healthy ?? true;

  if (loading) {
    return (
      <div style={{ background: "#1a1a2e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#d4a537", fontSize: "14px", fontFamily: "monospace" }}>Engine Monitor laden...</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#1a1a2e", minHeight: "100vh", padding: "24px", color: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: 0, color: "#d4a537" }}>Engine Monitor</h1>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600,
            padding: "4px 12px", borderRadius: "20px",
            background: isHealthy ? "rgba(0,230,160,0.1)" : "rgba(255,80,69,0.1)",
            color: isHealthy ? "#00e6a0" : "#ff5045",
            border: `1px solid ${isHealthy ? "rgba(0,230,160,0.2)" : "rgba(255,80,69,0.2)"}`,
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isHealthy ? "#00e6a0" : "#ff5045", boxShadow: `0 0 8px ${isHealthy ? "#00e6a0" : "#ff5045"}` }} />
            {isHealthy ? "HEALTHY" : "ALARM"}
          </span>
        </div>
        {lastRefresh && <span style={{ fontSize: "11px", color: "#666", fontFamily: "monospace" }}>Aktualisiert: {lastRefresh}</span>}
      </div>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <SummaryCard label="Erkannt" value={summary.detected} color="#aaa" />
        <SummaryCard label="Kopiert" value={summary.copied} color="#00e6a0" />
        <SummaryCard label="Geblockt" value={summary.blocked} color="#d4a537" />
        <SummaryCard label="Verpasst" value={summary.missed} color={summary.missed > 0 ? "#ff5045" : "#aaa"} />
      </div>

      {/* Pair Status Cards */}
      {health?.pairs && health.pairs.length > 0 && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          {health.pairs.map((pair) => (
            <div key={pair.name} style={{ background: "#0f0f1e", border: "1px solid #2a2a4a", borderRadius: "12px", padding: "16px", flex: "1 1 280px", minWidth: "260px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>{pair.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: pair.healthy ? "#00e6a0" : "#ff5045" }} />
                <span style={{ fontSize: "11px", color: pair.healthy ? "#00e6a0" : "#ff5045", fontWeight: 600 }}>{pair.healthy ? "HEALTHY" : "ALARM"}</span>
                {pair.lastEvent && <span style={{ fontSize: "10px", color: "#666", marginLeft: "auto", fontFamily: "monospace" }}>{formatTime(pair.lastEvent)}</span>}
              </div>
              <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
                <span style={{ color: "#00e6a0" }}>{pair.copied} kopiert</span>
                <span style={{ color: "#d4a537" }}>{pair.blocked} geblockt</span>
                <span style={{ color: pair.missed > 0 ? "#ff5045" : "#666" }}>{pair.missed} verpasst</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Events Table */}
      <div style={{ background: "#0f0f1e", border: "1px solid #2a2a4a", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a4a", fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Letzte Events ({events.length})
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "monospace" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
                {["Zeit", "Symbol", "Richtung", "Status", "Grund", "Latenz"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#666" }}>Keine Events heute</td></tr>
              )}
              {events.map((ev) => (
                <tr key={ev.id} style={{
                  borderBottom: "1px solid #1a1a2e",
                  background: ev.status === "MISSED" ? "#ff504510" : "transparent",
                }}>
                  <td style={{ padding: "10px 16px", color: "#aaa" }}>{formatTime(ev.created_at)}</td>
                  <td style={{ padding: "10px 16px", color: "#fff", fontWeight: 600 }}>{ev.symbol}</td>
                  <td style={{ padding: "10px 16px", color: ev.direction === "BUY" ? "#00e6a0" : "#ff5045" }}>{ev.direction}</td>
                  <td style={{ padding: "10px 16px" }}><StatusBadge status={ev.status} /></td>
                  <td style={{ padding: "10px 16px", color: "#888", fontSize: "12px" }}>{ev.block_reason || ev.error_message || "—"}</td>
                  <td style={{ padding: "10px 16px", color: ev.latency_ms > 1000 ? "#ff5045" : "#aaa" }}>{ev.latency_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
