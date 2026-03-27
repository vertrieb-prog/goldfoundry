import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — ENGINE EVENT EMITTER
// Sendet Events an Supabase für das Live Terminal
// ═══════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type EventType =
  | "signal" | "gate" | "score" | "ai" | "mode"
  | "exec" | "fill" | "tick" | "dca" | "recovery"
  | "tp" | "trail" | "pyramid" | "close" | "result" | "log";

async function send(userId: string, groupId: string | null, type: EventType, icon: string, badge: string, text: string, detail: string, color: string, pnl?: number) {
  try {
    await supabase.from("engine_events").insert({
      user_id: userId, group_id: groupId,
      type, icon, badge, text, detail, color, pnl: pnl || null,
    });
  } catch {}
}

export const emit = {
  signal: (uid: string, gid: string, sym: string, dir: string, price: number) =>
    send(uid, gid, "signal", "📡", "SIGNAL", "Signal erkannt", `${dir} ${sym} @ ${price}`, "#d4a537"),

  gate: (uid: string, name: string, pass: boolean, detail: string) =>
    send(uid, null, "gate", pass ? "✅" : "❌", pass ? "PASS" : "FAIL", name, detail, pass ? "#00e6a0" : "#ff5045"),

  score: (uid: string, gid: string, score: number, detail: string) =>
    send(uid, gid, "score", "🎯", "SCORE", `Signal Score: ${score}/100`, detail, "#d4a537"),

  ai: (uid: string, gid: string, verdict: string, reason: string, tokens: number) =>
    send(uid, gid, "ai", "🧠", "AI", `AI: ${verdict}`, `"${reason}" (${tokens}T)`, "#a78bfa"),

  mode: (uid: string, sym: string, mode: string, adx: number) =>
    send(uid, null, "mode", mode === "TREND" ? "📈" : mode === "RANGE" ? "↔️" : "⏳", mode, `Market Mode: ${mode}`, `ADX ${adx.toFixed(0)} · ${sym}`, mode === "TREND" ? "#00e6a0" : "#22d3ee"),

  exec: (uid: string, gid: string, sym: string, count: number, lots: number) =>
    send(uid, gid, "exec", "⚡", "LIVE", `${count} Orders eröffnet`, `${lots.toFixed(2)}L total · ${sym}`, "#f0d060"),

  fill: (uid: string, gid: string, entry: number, sl: number, lots: number) =>
    send(uid, gid, "fill", "💰", "FILL", "Fill bestätigt", `Entry: ${entry} · SL: ${sl} · ${lots.toFixed(2)}L`, "#4d9fff"),

  dca: (uid: string, gid: string, level: number, lots: number, price: number) =>
    send(uid, gid, "dca", "💎", `DCA${level}`, `DCA${level} nachgekauft`, `+${lots.toFixed(2)}L @ ${price}`, "#4d9fff"),

  recovery: (uid: string, gid: string, dir: string, lots: number, price: number, tp: number) =>
    send(uid, gid, "recovery", "🔄", "RECOVERY", `Zone Recovery: ${dir}`, `${lots.toFixed(2)}L @ ${price} · TP: ${tp}`, "#a78bfa"),

  tp: (uid: string, gid: string, num: number, lots: number, price: number, pnl: number) =>
    send(uid, gid, "tp", "✅", `TP${num}`, `TP${num} getroffen!`, `${lots.toFixed(2)}L @ ${price} · +€${pnl.toFixed(2)}`, "#00e6a0", pnl),

  trail: (uid: string, gid: string, badge: string, sl: number, info: string) =>
    send(uid, gid, "trail", "📐", badge, "SL nachgezogen", `SL: ${sl} · ${info}`, "#d4a537"),

  pyramid: (uid: string, gid: string, lots: number, price: number) =>
    send(uid, gid, "pyramid", "🏔️", "PYRAMID", `Pyramiding! +${lots.toFixed(2)}L`, `Neue Position @ ${price}`, "#f0d060"),

  close: (uid: string, gid: string, pnl: number, detail: string) =>
    send(uid, gid, "result", pnl >= 0 ? "🏆" : "📉", pnl >= 0 ? "PROFIT" : "LOSS", `Trade komplett: ${pnl >= 0 ? "+" : ""}€${pnl.toFixed(2)}`, detail, pnl >= 0 ? "#00e6a0" : "#ff5045", pnl),

  tick: (uid: string, gid: string, price: number, floating: number) =>
    send(uid, gid, "tick", "🔄", "30s", "Engine Tick", `Preis: ${price} · ${floating >= 0 ? "+" : ""}€${floating.toFixed(2)}`, "#6d6045"),
};
