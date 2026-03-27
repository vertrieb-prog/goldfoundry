"use client";
import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const T = {
  bg: "#040302", bg2: "#0a0806", bg3: "#110e09",
  gold: "#d4a537", goldLt: "#f0d060",
  text: "#cec0a0", dim: "#6d6045", bright: "#fff6e4",
  green: "#00e6a0", red: "#ff5045", blue: "#4d9fff",
  purple: "#a78bfa",
};

interface EngineEvent {
  id: number;
  type: string;
  icon: string;
  badge: string;
  text: string;
  detail: string;
  color: string;
  pnl?: number;
  created_at: string;
}

export default function LiveTerminal({ userId }: { userId: string }) {
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [todayPnl, setTodayPnl] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowser();

  // Lade letzte 50 Events
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("engine_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setEvents(data.reverse());
    })();
  }, [userId]);

  // Realtime Subscription
  useEffect(() => {
    const ch = supabase
      .channel("engine-live")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "engine_events",
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        const e = payload.new as EngineEvent;
        setEvents(prev => [...prev.slice(-99), e]);
        if (e.pnl) setTodayPnl(p => p + (e.pnl || 0));
        setIsLive(true);
      })
      .subscribe();
    setIsLive(true);
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  const fmt = (ts: string) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
  };

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", background: T.bg2, border: `1px solid ${T.gold}15` }}>
      <div style={{ padding: "10px 14px", background: T.bg3, borderBottom: `1px solid ${T.gold}10`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.red }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isLive ? T.green : T.dim }} />
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: T.dim }}>engine-v3</span>
          {isLive && <span style={{ fontSize: 10, color: T.green }}>● LIVE</span>}
        </div>
        <span style={{ fontFamily: "monospace", fontSize: 14, color: todayPnl >= 0 ? T.green : T.red, fontWeight: 700 }}>
          {todayPnl >= 0 ? "+" : ""}€{todayPnl.toFixed(2)}
        </span>
      </div>

      <div ref={scrollRef} style={{ maxHeight: 400, overflowY: "auto", padding: "4px 0" }}>
        {events.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", color: T.dim, fontSize: 13 }}>
            Warte auf Signale... 💤
          </div>
        )}
        {events.map(e => (
          <div key={e.id} style={{
            padding: "5px 12px", display: "flex", gap: 6, alignItems: "flex-start",
            background: e.type === "result" ? `${e.color}06` : "transparent",
            borderBottom: `1px solid ${T.bg3}`,
          }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: T.dim, minWidth: 52, paddingTop: 3 }}>{fmt(e.created_at)}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3, color: e.color, background: `${e.color}15`, border: `1px solid ${e.color}20`, minWidth: 40, textAlign: "center", flexShrink: 0 }}>{e.badge}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13 }}>{e.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.bright }}>{e.text}</span>
              </div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 1, fontFamily: e.type === "ai" ? "inherit" : "monospace", fontStyle: e.type === "ai" ? "italic" : "normal" }}>{e.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "6px 14px", background: T.bg3, borderTop: `1px solid ${T.gold}10`, fontSize: 10, color: T.dim, fontFamily: "monospace", display: "flex", justifyContent: "space-between" }}>
        <span>Events: {events.length}</span>
        <span>AI: {events.filter(e => e.type === "ai").length} · TPs: {events.filter(e => e.type === "tp").length}</span>
      </div>
    </div>
  );
}
