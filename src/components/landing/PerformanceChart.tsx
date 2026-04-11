"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { ChartSeries, TradeMarker } from "./TvChart";

const TvChart = dynamic(() => import("./TvChart"), { ssr: false });

/* ─── Types ─── */
interface MyfxAccount {
  id?: number;
  name: string;
  gain: number;
  absGain: number;
  daily: number;
  monthly: number;
  drawdown: number;
  balance: number;
  equity: number;
  profit: number;
  pips: number;
  deposits: number;
}

interface DailyGainEntry { date: string; value: number; profit: number }
interface DailyDataEntry { date: string; balance: number; pips: number; profit: number; growthEquity: number }

interface MyfxData {
  accounts: MyfxAccount[];
  dailyGains?: { accountId: number; accountName: string; dailyGain: DailyGainEntry[] }[];
  dailyDatas?: { accountId: number; dataDaily: DailyDataEntry[] }[];
  totalGain: number;
  totalBalance: number;
  totalEquity: number;
  totalProfit: number;
  totalDrawdown: number;
  totalDaily: number;
  totalMonthly: number;
}

interface Props {
  growthCurve: { date: string; growth: number; equity: number }[];
  drawdownCurve: { date: string; dd: number }[];
  equityCurve: { date: string; equity: number }[];
  recentTrades: { direction: string; symbol: string; lots: number; pnl: number; time: string }[];
  gain: number;
  maxDd: number;
  todayTrades: number;
  winrate: number;
  myfxbook?: MyfxData | null;
}

type ChartTab = "growth" | "balance" | "profit" | "drawdown";

const MONO = "'JetBrains Mono', monospace";
const numColor = (v: number) => v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#e0d4b8";
const fmtMoney = (v: number) => `${v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

/* ─── Growth Comparison Chart (multi-line, like MyFXBook) ─── */
const LINE_COLORS = ["#a1a1aa", "#e8785e", "#3b82f6", "#22c55e", "#d4a537"];

function GrowthComparisonChart({ series }: { series: { name: string; data: { date: string; value: number }[] }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const validSeries = series.filter((s) => s.data.length >= 2);
  if (!validSeries.length) return <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#6d6045", fontSize: 13 }}>Lade Chart-Daten...</div>;

  // Merge all dates
  const allDates = [...new Set(validSeries.flatMap((s) => s.data.map((d) => d.date)))].sort();
  const w = 640, h = 280, padL = 45, padR = 15, padT = 15, padB = 40;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const n = allDates.length;
  const denom = Math.max(n - 1, 1);

  // Find global min/max
  const allVals = validSeries.flatMap((s) => s.data.map((d) => d.value));
  const vMin = Math.min(0, ...allVals);
  const vMax = Math.max(1, ...allVals);
  const range = Math.max(vMax - vMin, 0.01);

  const toX = (i: number) => padL + (i / denom) * chartW;
  const toY = (v: number) => padT + ((vMax - v) / range) * chartH;

  // Grid
  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const pct = i / gridCount;
    return { y: padT + pct * chartH, val: vMax - pct * range };
  });

  // Date labels
  const dateIdxs = allDates.length <= 7
    ? allDates.map((_, i) => i)
    : [0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1].filter((v, i, a) => a.indexOf(v) === i);

  // Format date for display: "Mar 30, '26"
  const fmtDate = (d: string) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}, '${parts[0].slice(2)}`;
  };

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", display: "block" }} onMouseLeave={() => setHover(null)}>
        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padL} y1={g.y} x2={w - padR} y2={g.y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <text x={padL - 6} y={g.y + 3} fill="#52525b" fontSize="8" fontFamily={MONO} textAnchor="end">{g.val.toFixed(1)}%</text>
          </g>
        ))}

        {/* Vertical grid */}
        {dateIdxs.map((i) => (
          <line key={`vg${i}`} x1={toX(i)} y1={padT} x2={toX(i)} y2={padT + chartH} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        ))}

        {/* Lines for each account */}
        {validSeries.map((s, si) => {
          const dateMap = new Map(s.data.map((d) => [d.date, d.value]));
          const pts: { x: number; y: number; idx: number }[] = [];
          allDates.forEach((date, i) => {
            const val = dateMap.get(date);
            if (val !== undefined) pts.push({ x: toX(i), y: toY(val), idx: i });
          });
          if (pts.length < 2) return null;
          const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          return <path key={s.name} d={path} fill="none" stroke={LINE_COLORS[si % LINE_COLORS.length]} strokeWidth="2" strokeLinejoin="round" />;
        })}

        {/* Hover targets */}
        {allDates.map((_, i) => (
          <rect key={i} x={toX(i) - chartW / Math.max(n, 1) / 2} y={0} width={chartW / Math.max(n, 1)} height={h - padB} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}

        {/* Hover tooltip */}
        {hover !== null && (
          <g>
            <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT + chartH} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3,3" />
            {validSeries.map((s, si) => {
              const dateMap = new Map(s.data.map((d) => [d.date, d.value]));
              const val = dateMap.get(allDates[hover]);
              if (val === undefined) return null;
              return <circle key={s.name} cx={toX(hover)} cy={toY(val)} r="3.5" fill={LINE_COLORS[si % LINE_COLORS.length]} stroke="#0a0906" strokeWidth="1.5" />;
            })}
            {/* Tooltip box */}
            <rect x={Math.min(toX(hover) - 70, w - padR - 145)} y={padT} width={140} height={14 + validSeries.length * 14} rx="4" fill="rgba(10,9,6,0.95)" stroke="rgba(212,165,55,0.15)" strokeWidth="0.5" />
            <text x={Math.min(toX(hover) - 60, w - padR - 135)} y={padT + 11} fill="#8a7a5a" fontSize="8" fontFamily={MONO}>{fmtDate(allDates[hover])}</text>
            {validSeries.map((s, si) => {
              const dateMap = new Map(s.data.map((d) => [d.date, d.value]));
              const val = dateMap.get(allDates[hover]);
              if (val === undefined) return null;
              return (
                <text key={s.name} x={Math.min(toX(hover) - 60, w - padR - 135)} y={padT + 24 + si * 14} fill={LINE_COLORS[si % LINE_COLORS.length]} fontSize="9" fontFamily={MONO}>
                  {s.name}: {val.toFixed(2)}%
                </text>
              );
            })}
          </g>
        )}

        {/* Date labels */}
        {dateIdxs.map((i) => (
          <text key={i} x={toX(i)} y={h - padB + 16} fill="#52525b" fontSize="8" fontFamily={MONO} textAnchor="middle">{fmtDate(allDates[i])}</text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, paddingTop: 4 }}>
        {validSeries.map((s, si) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 16, height: 2, background: LINE_COLORS[si % LINE_COLORS.length], display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#8a7a5a" }}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Single Line Chart (for individual account view) ─── */
function SingleChart({ data, tab }: { data: { date: string; value: number }[]; tab: ChartTab }) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length < 2) return <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#6d6045", fontSize: 13 }}>Keine Daten</div>;

  const w = 640, h = 240, padL = 50, padR = 15, padT = 15, padB = 25;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const values = data.map((d) => d.value);
  const vMin = Math.min(0, ...values);
  const vMax = Math.max(0.01, ...values);
  const range = Math.max(vMax - vMin, 0.01);
  const n = data.length, denom = Math.max(n - 1, 1);
  const toX = (i: number) => padL + (i / denom) * chartW;
  const toY = (v: number) => padT + ((vMax - v) / range) * chartH;
  const lineColor = tab === "drawdown" ? "#ef4444" : tab === "balance" ? "#d4a537" : "#22c55e";

  const pts = values.map((v, i) => ({ x: toX(i), y: toY(v) }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => ({ y: padT + (i / gridCount) * chartH, val: vMax - (i / gridCount) * range }));
  const dateIdxs = [0, Math.floor(n / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i && v < n);

  const formatAxis = (v: number) => tab === "balance" ? `${(v / 1000).toFixed(1)}k€` : tab === "profit" ? `${Math.round(v)}€` : `${v.toFixed(1)}%`;
  const formatVal = (v: number) => tab === "balance" ? `${Math.round(v).toLocaleString("de-DE")}€` : tab === "profit" ? `${v >= 0 ? "+" : ""}${Math.abs(Math.round(v))}€` : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", display: "block" }} onMouseLeave={() => setHover(null)}>
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.y} x2={w - padR} y2={g.y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <text x={padL - 6} y={g.y + 3} fill="#52525b" fontSize="8" fontFamily={MONO} textAnchor="end">{formatAxis(g.val)}</text>
        </g>
      ))}
      {vMin < 0 && <line x1={padL} y1={toY(0)} x2={w - padR} y2={toY(0)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="4,4" />}
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
      {values.map((_, i) => <rect key={i} x={toX(i) - chartW / n / 2} y={0} width={chartW / n} height={h} fill="transparent" onMouseEnter={() => setHover(i)} />)}
      {hover !== null && pts[hover] && (
        <g>
          <line x1={pts[hover].x} y1={padT} x2={pts[hover].x} y2={padT + chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3,3" />
          <circle cx={pts[hover].x} cy={pts[hover].y} r="3.5" fill={lineColor} stroke="#0a0906" strokeWidth="2" />
          <rect x={Math.min(pts[hover].x - 55, w - padR - 115)} y={Math.max(padT, pts[hover].y - 28)} width={110} height={20} rx="4" fill="#0a0906" stroke="rgba(212,165,55,0.15)" strokeWidth="0.5" />
          <text x={Math.min(pts[hover].x, w - padR - 60)} y={Math.max(padT + 13, pts[hover].y - 14)} fill="#e0d4b8" fontSize="9" fontFamily={MONO} textAnchor="middle">{data[hover].date.slice(5)} | {formatVal(values[hover])}</text>
        </g>
      )}
      {dateIdxs.map((i) => <text key={i} x={toX(i)} y={h - 4} fill="#52525b" fontSize="8" fontFamily={MONO} textAnchor="middle">{data[i].date.slice(5).replace("-", "/")}</text>)}
    </svg>
  );
}

function TotalCell({ accounts }: { accounts: MyfxAccount[] }) {
  const tp = accounts.reduce((s, a) => s + a.profit, 0);
  const tg = accounts.reduce((s, a) => s + a.gain, 0) / Math.max(accounts.length, 1);
  return (
    <div style={{ fontSize: 12, fontFamily: MONO, padding: "8px 8px", fontWeight: 700, color: numColor(tp) }}>
      <div>{tp >= 0 ? "+" : ""}{fmtMoney(tp)}</div>
      <div style={{ fontSize: 9, color: numColor(tg), opacity: 0.7 }}>{tg >= 0 ? "+" : ""}{tg.toFixed(1)}%</div>
    </div>
  );
}

/* ─── Trading Periods Table — per account with 24h/72h/Woche/Monat ─── */
function TradingPeriods({ accounts, dailyGains }: { accounts: MyfxAccount[]; dailyGains?: { accountId: number; accountName: string; dailyGain: DailyGainEntry[] }[] }) {
  const hdr = { fontSize: 10, fontWeight: 600 as const, color: "#6d6045", textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "10px 8px" };
  const cellStyle = { fontSize: 12, fontFamily: MONO, padding: "10px 8px", fontWeight: 500 as const };
  const periodLabels = ["24h", "72h", "7 Tage", "30 Tage"];
  const periodDays = [1, 3, 7, 30];
  const cols = `2fr ${periodLabels.map(() => "1.2fr").join(" ")} 1.2fr`;

  const getProfit = (accId: number | undefined, days: number) => {
    if (!dailyGains?.length || !accId) return 0;
    const dg = dailyGains.find((d) => d.accountId === accId);
    if (!dg?.dailyGain?.length) return 0;
    const slice = dg.dailyGain.slice(-days);
    return Math.round(slice.reduce((s, d) => s + (d.profit ?? 0), 0) * 100) / 100;
  };

  const getGainPct = (accId: number | undefined, days: number) => {
    if (!dailyGains?.length || !accId) return 0;
    const dg = dailyGains.find((d) => d.accountId === accId);
    if (!dg?.dailyGain?.length) return 0;
    const data = dg.dailyGain;
    const endVal = data[data.length - 1]?.value ?? 0;
    const startIdx = Math.max(0, data.length - days - 1);
    const startVal = data[startIdx]?.value ?? 0;
    return Math.round((endVal - startVal) * 100) / 100;
  };

  // Fallback: berechne aus Account-Metriken wenn dailyGains fehlen
  const getProfitFallback = (a: MyfxAccount, days: number) => {
    if (days <= 1) return Math.round(a.balance * a.daily / 100 * 100) / 100;
    if (days <= 3) return Math.round(a.balance * a.daily / 100 * Math.min(days, 3) * 100) / 100;
    if (days <= 7) return Math.round(a.profit * 0.25 * 100) / 100; // ~25% vom Gesamtprofit als Wochenschaetzung
    return Math.round(a.profit * 100) / 100; // Monat = Gesamtprofit (da Accounts meist <30 Tage alt)
  };

  const getPctFallback = (a: MyfxAccount, days: number) => {
    if (days <= 1) return Math.round(a.daily * 100) / 100;
    if (days <= 3) return Math.round(a.daily * Math.min(days, 3) * 100) / 100;
    if (days <= 7) return Math.round(a.gain * 0.25 * 100) / 100;
    return Math.round(a.gain * 100) / 100;
  };

  const getVal = (a: MyfxAccount, days: number) => {
    const fromDG = getProfit(a.id, days);
    if (fromDG !== 0) return { profit: fromDG, pct: getGainPct(a.id, days) };
    return { profit: getProfitFallback(a, days), pct: getPctFallback(a, days) };
  };

  const totalVal = (days: number) => {
    let profit = 0, pctSum = 0;
    const totalDep = accounts.reduce((s, a) => s + a.deposits, 0);
    for (const a of accounts) {
      const v = getVal(a, days);
      profit += v.profit;
      pctSum += totalDep > 0 ? v.pct * (a.deposits / totalDep) : 0;
    }
    return { profit: Math.round(profit * 100) / 100, pct: Math.round(pctSum * 100) / 100 };
  };

  return (
    <div style={{ background: "#0a0906", border: "1px solid rgba(212,165,55,0.08)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", fontSize: 12, fontWeight: 700, color: "#d4a537", borderBottom: "1px solid rgba(212,165,55,0.08)" }}>
        Profit nach Zeitraum
      </div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: cols, borderBottom: "1px solid rgba(212,165,55,0.08)", minWidth: 700 }}>
        <div style={hdr}>Name</div>
        {periodLabels.map((l) => <div key={l} style={hdr}>{l}</div>)}
        <div style={hdr}>Gesamt</div>
      </div>
      {/* Rows per account */}
      <div style={{ minWidth: 700 }}>
        {accounts.map((a, i) => (
          <div key={a.name} style={{ display: "grid", gridTemplateColumns: cols, borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
            <div style={{ ...cellStyle, color: "#e0d4b8", fontWeight: 600 }}>{a.name}</div>
            {periodDays.map((d, j) => {
              const v = getVal(a, d);
              return <div key={periodLabels[j]} style={{ ...cellStyle, color: numColor(v.profit) }}>
                <div>{v.profit >= 0 ? "+" : ""}{fmtMoney(v.profit)}</div>
                <div style={{ fontSize: 9, color: numColor(v.pct), opacity: 0.8 }}>{v.pct >= 0 ? "+" : ""}{v.pct.toFixed(2)}%</div>
              </div>;
            })}
            <div style={{ ...cellStyle, color: numColor(a.profit), fontWeight: 700 }}>
              <div>{a.profit >= 0 ? "+" : ""}{fmtMoney(a.profit)}</div>
              <div style={{ fontSize: 9, color: numColor(a.gain), opacity: 0.8 }}>{a.gain >= 0 ? "+" : ""}{a.gain.toFixed(2)}%</div>
            </div>
          </div>
        ))}
        {/* Total row */}
        <div style={{ display: "grid", gridTemplateColumns: cols, borderTop: "2px solid rgba(212,165,55,0.15)", background: "rgba(212,165,55,0.04)" }}>
          <div style={{ ...cellStyle, color: "#d4a537", fontWeight: 700, fontSize: 13 }}>Total:</div>
          {periodDays.map((d, j) => {
            const v = totalVal(d);
            return <div key={periodLabels[j]} style={{ ...cellStyle, color: numColor(v.profit), fontWeight: 700 }}>
              <div>{v.profit >= 0 ? "+" : ""}{fmtMoney(v.profit)}</div>
              <div style={{ fontSize: 9, color: numColor(v.pct), opacity: 0.8 }}>{v.pct >= 0 ? "+" : ""}{v.pct.toFixed(2)}%</div>
            </div>;
          })}
          <TotalCell accounts={accounts} />
        </div>
      </div>
      </div>
    </div>
  );
}

/* ─── Stats Panel (Left Side) ─── */
function StatsPanel({ account, total }: { account: MyfxAccount | null; total: MyfxData }) {
  const n = total.accounts.length || 1;
  const a = account || {
    gain: total.accounts.reduce((s, x) => s + x.gain, 0) / n,
    absGain: total.accounts.reduce((s, x) => s + x.absGain, 0) / n,
    daily: total.accounts.reduce((s, x) => s + x.daily, 0) / n,
    monthly: total.accounts.reduce((s, x) => s + x.monthly, 0) / n,
    drawdown: total.accounts.reduce((s, x) => s + x.drawdown, 0) / n,
    balance: total.totalBalance, equity: total.totalEquity, profit: total.totalProfit,
    deposits: total.accounts.reduce((s, x) => s + x.deposits, 0),
    pips: total.accounts.reduce((s, x) => s + x.pips, 0), name: "Portfolio",
  };

  const sections = [
    [
      { label: "Gain", value: fmtPct(a.gain), color: numColor(a.gain) },
      { label: "Abs. Gain", value: fmtPct(a.absGain), color: numColor(a.absGain) },
      { label: "Daily", value: `${a.daily.toFixed(2)}%`, color: numColor(a.daily) },
      { label: "Monthly", value: `${a.monthly.toFixed(2)}%`, color: numColor(a.monthly) },
      { label: "Drawdown", value: `${a.drawdown.toFixed(2)}%`, color: "#ef4444" },
    ],
    [
      { label: "Balance", value: fmtMoney(a.balance), color: "#e0d4b8" },
      { label: "Equity", value: `(100.00%) ${fmtMoney(a.equity)}`, color: "#e0d4b8" },
      { label: "Profit", value: fmtMoney(a.profit), color: numColor(a.profit) },
    ],
    [
      { label: "Deposits", value: fmtMoney(a.deposits), color: "#e0d4b8" },
      { label: "Withdrawals", value: "0,00€", color: "#e0d4b8" },
    ],
  ];

  return (
    <div style={{ minWidth: 230, maxWidth: 280 }}>
      {sections.map((rows, si) => (
        <div key={si} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 10, marginBottom: 10 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ color: "#8a7a5a", fontSize: 12 }}>{r.label}</span>
              <span style={{ color: r.color, fontFamily: MONO, fontSize: 12, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Systems Table (Below Chart — like MyFXBook) ─── */
function SystemsTable({ accounts, total, selectedName, onSelect }: {
  accounts: MyfxAccount[];
  total: MyfxData;
  selectedName: string | null;
  onSelect: (name: string | null) => void;
}) {
  const cols = ["Name", "Gain", "Drawdown", "Winrate", "Trades", "Balance", "Equity", "Profit"];
  const colWidths = "2.2fr 1fr 1fr 0.8fr 0.8fr 1.3fr 1.3fr 1.2fr";
  const headerStyle = { fontSize: 10, fontWeight: 600 as const, color: "#6d6045", textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "8px 8px" };
  const cellStyle = { fontSize: 12, fontFamily: MONO, padding: "8px 8px", fontWeight: 500 as const };

  // Build 72h profit map from dailyGains (sum of last 3 entries)
  const last72hProfitMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (total.dailyGains) {
      for (const dg of total.dailyGains) {
        const data = dg.dailyGain;
        const last3 = data.slice(-3);
        map[String(dg.accountId)] = Math.round(last3.reduce((s, d) => s + d.profit, 0) * 100) / 100;
      }
    }
    return map;
  }, [total.dailyGains]);

  const get72hProfit = (a: MyfxAccount) => {
    if (a.id && last72hProfitMap[String(a.id)] !== undefined) return last72hProfitMap[String(a.id)];
    // Fallback: balance * daily%
    return Math.round(a.balance * a.daily / 100 * 100) / 100;
  };

  const renderRow = (a: MyfxAccount, isTotal: boolean, idx?: number) => {
    return (
    <div
      key={a.name + (isTotal ? "-total" : "")}
      style={{
        display: "grid", gridTemplateColumns: colWidths,
        background: isTotal ? "rgba(212,165,55,0.03)" : selectedName === a.name ? "rgba(212,165,55,0.05)" : "transparent",
        borderTop: isTotal ? "1px solid rgba(212,165,55,0.1)" : idx !== undefined && idx > 0 ? "1px solid rgba(255,255,255,0.02)" : "none",
        cursor: "pointer",
      }}
      onClick={() => isTotal ? onSelect(null) : onSelect(selectedName === a.name ? null : a.name)}
    >
      <div style={{ ...cellStyle, color: isTotal ? "#d4a537" : selectedName === a.name ? "#d4a537" : "#e0d4b8", fontWeight: isTotal ? 700 : 600 }}>
        {isTotal ? (selectedName ? "\u2190 Alle anzeigen" : "Total:") : a.name}
      </div>
      <div style={{ ...cellStyle, color: numColor(a.gain) }}>{a.gain >= 0 ? "+" : ""}{a.gain.toFixed(2)}%</div>
      <div style={{ ...cellStyle, color: a.drawdown > 0 ? "#ef4444" : "#6d6045" }}>{a.drawdown > 0 ? a.drawdown.toFixed(2) + "%" : "\u2014"}</div>
      <div style={{ ...cellStyle, color: (a as any).winrate >= 50 ? "#22c55e" : "#6d6045" }}>{(a as any).winrate ? (a as any).winrate + "%" : "\u2014"}</div>
      <div style={{ ...cellStyle, color: "#e0d4b8" }}>{(a as any).trades || "\u2014"}</div>
      <div style={{ ...cellStyle, color: "#e0d4b8" }}>{fmtMoney(a.balance)}</div>
      <div style={{ ...cellStyle, color: "#e0d4b8" }}>{fmtMoney(a.equity)}</div>
      <div style={{ ...cellStyle, color: numColor(a.profit) }}>{a.profit >= 0 ? "+" : ""}{fmtMoney(a.profit)}</div>
    </div>
    );
  };

  const totalRow: MyfxAccount = {
    name: "Total", gain: total.totalGain, absGain: total.totalGain,
    daily: total.totalDaily, monthly: total.totalMonthly, drawdown: total.totalDrawdown,
    balance: total.totalBalance, equity: total.totalEquity, profit: total.totalProfit,
    pips: accounts.reduce((s, a) => s + a.pips, 0), deposits: accounts.reduce((s, a) => s + a.deposits, 0),
  };

  return (
    <div style={{ background: "#0a0906", border: "1px solid rgba(212,165,55,0.08)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: colWidths, borderBottom: "1px solid rgba(212,165,55,0.08)", minWidth: 900 }}>
        {cols.map((c) => <div key={c} style={headerStyle}>{c}</div>)}
      </div>
      {/* Rows */}
      <div style={{ minWidth: 900 }}>
        {accounts.map((a, i) => renderRow(a, false, i))}
        {renderRow(totalRow, true)}
      </div>
      </div>
    </div>
  );
}

/* ─── Main Export ─── */
export default function PerformanceChart({ growthCurve, drawdownCurve, equityCurve, recentTrades, gain, maxDd, todayTrades, winrate, myfxbook }: Props) {
  const [tab, setTab] = useState<ChartTab>("growth");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const mfx = myfxbook;
  const tabs: { id: ChartTab; label: string }[] = [
    { id: "growth", label: "Growth" },
    { id: "balance", label: "Balance" },
    { id: "profit", label: "Profit" },
    { id: "drawdown", label: "Drawdown" },
  ];

  // Build multi-line comparison data (all accounts)
  const getComparisonSeries = (): { name: string; data: { date: string; value: number }[] }[] => {
    if (!mfx?.dailyGains?.length) {
      // Fallback: single series from MetaApi
      return [{ name: "PHANTOM", data: growthCurve.map((g) => ({ date: g.date, value: g.growth })) }];
    }
    return mfx.dailyGains.map((dg) => ({
      name: dg.accountName,
      data: dg.dailyGain.filter((d) => d.date).map((d) => ({ date: d.date, value: d.value })),
    }));
  };

  // Build single-account chart data for tab view
  const getSingleChartData = (): { date: string; value: number }[] => {
    const accName = selectedAccount;
    const gainData = mfx?.dailyGains?.find((d) => accName ? d.accountName === accName : true);
    const balData = mfx?.dailyDatas?.find((d) => accName ? mfx.accounts.find((a) => a.name === accName)?.id === d.accountId : true);

    if (tab === "growth" && gainData?.dailyGain?.length) {
      return gainData.dailyGain.filter((d) => d.date).map((d) => ({ date: d.date, value: d.value }));
    }
    if (tab === "balance" && balData?.dataDaily?.length) {
      return balData.dataDaily.filter((d) => d.date).map((d) => ({ date: d.date, value: d.balance }));
    }
    if (tab === "profit" && gainData?.dailyGain?.length) {
      return gainData.dailyGain.filter((d) => d.date).map((d) => ({ date: d.date, value: d.profit }));
    }
    if (tab === "drawdown") {
      return drawdownCurve.map((d) => ({ date: d.date, value: -d.dd }));
    }

    // Fallback to MetaApi
    if (tab === "balance") return equityCurve.map((g) => ({ date: g.date, value: g.equity }));
    return growthCurve.map((g) => ({ date: g.date, value: g.growth }));
  };

  const currentAccount = mfx?.accounts.find((a) => a.name === selectedAccount) ?? null;
  const showComparison = !selectedAccount && tab === "growth";

  // Build TvChart series
  const tvSeries = useMemo((): ChartSeries[] => {
    if (showComparison) {
      return getComparisonSeries().map((s, i) => ({
        name: s.name,
        color: LINE_COLORS[i % LINE_COLORS.length],
        data: s.data.map((d) => ({ time: d.date, value: d.value })),
      }));
    }
    const data = getSingleChartData();
    const color = tab === "drawdown" ? "#ef4444" : tab === "balance" ? "#d4a537" : "#22c55e";
    const series: ChartSeries[] = [{ name: selectedAccount || "Portfolio", color, data: data.map((d) => ({ time: d.date, value: d.value })) }];

    // Add DD overlay when viewing growth for a specific account
    if (tab === "growth" && selectedAccount && mfx?.dailyGains) {
      const accDg = (mfx.dailyGains as any[]).find((d: any) => d.accountName === selectedAccount);
      if (accDg?.drawdownCurve?.length) {
        series.push({
          name: "Drawdown",
          color: "#ef4444",
          data: accDg.drawdownCurve.map((d: any) => ({ time: d.date, value: -d.dd })),
        });
      }
    }
    // Add DD overlay for portfolio view
    if (tab === "growth" && !selectedAccount && drawdownCurve.length > 0) {
      series.push({
        name: "Drawdown",
        color: "#ef4444",
        data: drawdownCurve.map((d) => ({ time: d.date, value: -d.dd })),
      });
    }

    return series;
  }, [mfx, selectedAccount, tab, growthCurve, equityCurve, drawdownCurve]);

  // Trade markers from recent trades
  const tvMarkers = useMemo((): TradeMarker[] => {
    return recentTrades.map((t) => ({
      time: t.time?.slice(0, 10) || "",
      position: t.direction === "BUY" ? "belowBar" as const : "aboveBar" as const,
      color: t.direction === "BUY" ? "#22c55e" : "#ef4444",
      shape: t.direction === "BUY" ? "arrowUp" as const : "arrowDown" as const,
      text: `${t.direction} ${t.symbol} ${t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(0)}€`,
    })).filter((m) => m.time);
  }, [recentTrades]);

  const priceFormatter = useMemo(() => {
    if (tab === "balance") return (v: number) => `${Math.round(v).toLocaleString("de-DE")}€`;
    if (tab === "profit") return (v: number) => `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString("de-DE")}€`;
    return (v: number) => `${v.toFixed(2)}%`;
  }, [tab]);

  return (
    <section style={{ padding: "60px 20px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fafafa", margin: 0 }}>
            Echte Performance
          </h2>
          <p style={{ fontSize: 13, color: "#8a7a5a", margin: "4px 0 0" }}>
            Live-Daten — verifiziert und automatisch synchronisiert
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#8a7a5a" }}>Auto-Sync</span>
        </div>
      </div>

      {/* Main Panel: Stats Left + Chart Right */}
      <div style={{
        background: "#0a0906", border: "1px solid rgba(212,165,55,0.08)", borderRadius: "10px 10px 0 0",
        display: "flex", gap: 24, padding: 20, flexWrap: "wrap",
      }}>
        {/* Left: Stats */}
        {mfx && <StatsPanel account={currentAccount} total={mfx} />}

        {/* Right: Chart */}
        <div style={{ flex: 1, minWidth: 320 }}>
          {/* Account Selector + Chart Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            {/* Account pills */}
            {mfx && mfx.accounts.length > 1 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <button
                  onClick={() => setSelectedAccount(null)}
                  style={{
                    padding: "4px 12px", fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: "pointer", border: "none",
                    background: !selectedAccount ? "rgba(212,165,55,0.12)" : "rgba(255,255,255,0.03)",
                    color: !selectedAccount ? "#d4a537" : "#6d6045",
                  }}
                >Alle</button>
                {mfx.accounts.map((a) => (
                  <button
                    key={a.name}
                    onClick={() => setSelectedAccount(selectedAccount === a.name ? null : a.name)}
                    style={{
                      padding: "4px 12px", fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: "pointer", border: "none",
                      background: selectedAccount === a.name ? "rgba(212,165,55,0.12)" : "rgba(255,255,255,0.03)",
                      color: selectedAccount === a.name ? "#d4a537" : "#6d6045",
                    }}
                  >{a.name}</button>
                ))}
              </div>
            )}

            {/* Chart Tabs */}
            <div style={{ display: "flex", gap: 0 }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: "5px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: "none", borderBottom: tab === t.id ? "2px solid #d4a537" : "2px solid transparent",
                    background: tab === t.id ? "rgba(212,165,55,0.06)" : "transparent",
                    color: tab === t.id ? "#e0d4b8" : "#6d6045",
                  }}
                >{t.label}</button>
              ))}
            </div>
          </div>

          {/* TradingView-Style Chart */}
          <TvChart
            series={tvSeries}
            height={320}
            formatValue={priceFormatter}
          />
        </div>
      </div>

      {/* Systems Table */}
      {mfx && (
        <div style={{ marginTop: 1 }}>
          <SystemsTable
            accounts={mfx.accounts}
            total={mfx}
            selectedName={selectedAccount}
            onSelect={setSelectedAccount}
          />
        </div>
      )}

      {/* Profit-Tabelle ist jetzt direkt in page.tsx */}

      {/* Recent Trades */}
      {recentTrades.length > 0 && (
        <div style={{ background: "#0a0906", border: "1px solid rgba(212,165,55,0.08)", borderRadius: 10, overflow: "hidden", marginTop: 16 }}>
          <div style={{ padding: "10px 12px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6d6045", borderBottom: "1px solid rgba(212,165,55,0.06)" }}>
            Letzte Trades
          </div>
          {recentTrades.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: i < recentTrades.length - 1 ? "1px solid rgba(255,255,255,0.02)" : "none", fontSize: 12, fontFamily: MONO }}>
              <span style={{ color: t.direction === "BUY" ? "#22c55e" : "#ef4444", fontWeight: 700, width: 32 }}>{t.direction}</span>
              <span style={{ color: "#e0d4b8", flex: 1 }}>{t.symbol}</span>
              <span style={{ color: "#6d6045" }}>{t.lots}L</span>
              <span style={{ color: t.pnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}€</span>
            </div>
          ))}
        </div>
      )}

    </section>
  );
}
