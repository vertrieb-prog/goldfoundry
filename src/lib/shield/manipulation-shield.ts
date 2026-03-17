// src/lib/shield/manipulation-shield.ts
// ============================================================
// FORGE SHIELD — Manipulation Detection & Capital Protection
// Every scenario covered. Konten schützen ist ALLES.
// ============================================================

export interface ShieldSignal {
  safe: boolean;
  multiplierOverride: number;     // 0.0 = BLOCK, 1.0 = normal
  detectedPatterns: DetectedPattern[];
  action: "ALLOW" | "REDUCE" | "BLOCK" | "CLOSE_ALL";
}

interface DetectedPattern {
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";
  description: string;
  suggestedAction: string;
}

interface PriceSnapshot {
  price: number;
  spread: number;
  volume: number;
  timestamp: number;
}

// ── Stop Hunt Detection ───────────────────────────────────────
// Pattern: Price spikes through a key level → immediately reverses
export function detectStopHunt(
  snapshots: PriceSnapshot[],
  keyLevels: number[],
  instrument: string
): DetectedPattern | null {
  if (snapshots.length < 10) return null;

  const recent = snapshots.slice(-10);
  const maxPrice = Math.max(...recent.map(s => s.price));
  const minPrice = Math.min(...recent.map(s => s.price));
  const currentPrice = recent[recent.length - 1].price;
  const pipsRange = instrument === "XAUUSD"
    ? (maxPrice - minPrice) * 100
    : maxPrice - minPrice;

  // Check if price swept a key level and came back
  for (const level of keyLevels) {
    const swept = recent.some(s => s.price > level) && recent.some(s => s.price < level);
    const returnedBelow = currentPrice < level && maxPrice > level;
    const returnedAbove = currentPrice > level && minPrice < level;

    if (swept && (returnedBelow || returnedAbove) && pipsRange > (instrument === "XAUUSD" ? 20 : 10)) {
      return {
        type: "STOP_HUNT",
        severity: "WARNING",
        description: `Stop Hunt bei ${level} erkannt. Preis sweepte Level und kehrte zurück. Range: ${pipsRange.toFixed(1)} Pips.`,
        suggestedAction: "Copier 15min pausieren. Kein neuer Trade auf diesem Level.",
      };
    }
  }

  return null;
}

// ── Flash Crash Detection ─────────────────────────────────────
// Gold: >50 Pips in 60sec | US500: >25 Points in 60sec
export function detectFlashCrash(
  snapshots: PriceSnapshot[],
  instrument: string
): DetectedPattern | null {
  if (snapshots.length < 6) return null; // Need at least 60sec of 10sec snapshots

  const latest = snapshots[snapshots.length - 1];
  const sixtySecAgo = snapshots.find(s => latest.timestamp - s.timestamp >= 55000);

  if (!sixtySecAgo) return null;

  const move = Math.abs(latest.price - sixtySecAgo.price);
  const threshold = instrument === "XAUUSD" ? 0.50 : 25; // $0.50 = 50 pips gold

  if (move > threshold) {
    return {
      type: "FLASH_CRASH",
      severity: "EMERGENCY",
      description: `Flash Crash erkannt! ${instrument} bewegte sich ${move.toFixed(2)} in 60 Sekunden.`,
      suggestedAction: "SOFORT alle Trades prüfen. Copier STOP. Warte 30min.",
    };
  }

  return null;
}

// ── Spread Anomaly Detection ──────────────────────────────────
export function detectSpreadAnomaly(
  currentSpread: number,
  avgSpread: number,
  instrument: string
): DetectedPattern | null {
  const ratio = currentSpread / Math.max(avgSpread, 0.01);

  if (ratio > 4) {
    return {
      type: "SPREAD_EXTREME",
      severity: "CRITICAL",
      description: `${instrument} Spread bei ${currentSpread} (${ratio.toFixed(1)}× Normal). Execution unmöglich.`,
      suggestedAction: "Copier BLOCK bis Spread normalisiert.",
    };
  }

  if (ratio > 2) {
    return {
      type: "SPREAD_WIDE",
      severity: "WARNING",
      description: `${instrument} Spread ${ratio.toFixed(1)}× über Normal. Slippage-Risiko erhöht.`,
      suggestedAction: "Copier Lots um 50% reduzieren.",
    };
  }

  return null;
}

// ── Liquidity Vacuum ──────────────────────────────────────────
// Spread > 3× normal AND volume < 30% normal
export function detectLiquidityVacuum(
  currentSpread: number,
  avgSpread: number,
  currentVolume: number,
  avgVolume: number
): DetectedPattern | null {
  if (currentSpread > avgSpread * 3 && currentVolume < avgVolume * 0.3) {
    return {
      type: "LIQUIDITY_VACUUM",
      severity: "CRITICAL",
      description: `Liquiditäts-Vakuum: Spread ${(currentSpread/avgSpread).toFixed(1)}× + Volume nur ${((currentVolume/avgVolume)*100).toFixed(0)}% vom Normal.`,
      suggestedAction: "Copier BLOCK. Kein Trading in illiquider Phase.",
    };
  }
  return null;
}

// ── News Spike Fake-Out ───────────────────────────────────────
// Initial move > X pips → reversal > 100% within 15min
export function detectNewsFakeOut(
  snapshots: PriceSnapshot[],
  instrument: string,
  newsTimestamp: number | null
): DetectedPattern | null {
  if (!newsTimestamp || snapshots.length < 30) return null;

  const now = Date.now();
  const timeSinceNews = (now - newsTimestamp) / 60000; // minutes

  if (timeSinceNews < 2 || timeSinceNews > 20) return null; // Too early or too late

  const newsIdx = snapshots.findIndex(s => s.timestamp >= newsTimestamp);
  if (newsIdx < 0) return null;

  const postNews = snapshots.slice(newsIdx);
  if (postNews.length < 5) return null;

  const firstMove = postNews[0].price;
  const peakAfterNews = postNews.reduce((p, s) =>
    Math.abs(s.price - firstMove) > Math.abs(p - firstMove) ? s.price : p, firstMove);
  const currentPrice = postNews[postNews.length - 1].price;

  const initialMove = peakAfterNews - firstMove;
  const reversal = currentPrice - peakAfterNews;

  // Reversal > 100% of initial move = fake-out
  if (Math.abs(initialMove) > 0 && Math.abs(reversal) > Math.abs(initialMove)) {
    return {
      type: "NEWS_FAKEOUT",
      severity: "WARNING",
      description: `News Fake-Out: Initialer Move ${initialMove > 0 ? "+" : ""}${initialMove.toFixed(2)} komplett reversed.`,
      suggestedAction: "Kein Kopieren für 15min. Warte auf echte Richtung.",
    };
  }

  return null;
}

// ── Correlation Break ─────────────────────────────────────────
// Gold and USD moving same direction = abnormal
export function detectCorrelationBreak(
  goldChange: number,
  dxyChange: number
): DetectedPattern | null {
  // Normal: Gold and DXY move opposite (-0.80 correlation)
  // Abnormal: Both positive or both negative
  if ((goldChange > 0.3 && dxyChange > 0.3) || (goldChange < -0.3 && dxyChange < -0.3)) {
    return {
      type: "CORRELATION_BREAK",
      severity: "WARNING",
      description: `Korrelations-Break: Gold ${goldChange > 0 ? "+" : ""}${goldChange.toFixed(1)}% und DXY ${dxyChange > 0 ? "+" : ""}${dxyChange.toFixed(1)}% gleiche Richtung.`,
      suggestedAction: "Regime-Wechsel möglich. Exposure um 30% reduzieren.",
    };
  }
  return null;
}

// ── Composite Shield Assessment ───────────────────────────────
export function runShieldAssessment(
  snapshots: PriceSnapshot[],
  instrument: string,
  keyLevels: number[],
  avgSpread: number,
  avgVolume: number,
  newsTimestamp: number | null,
  goldChange: number,
  dxyChange: number
): ShieldSignal {
  const patterns: DetectedPattern[] = [];
  const currentSnap = snapshots[snapshots.length - 1];

  // Run all detectors
  const stopHunt = detectStopHunt(snapshots, keyLevels, instrument);
  if (stopHunt) patterns.push(stopHunt);

  const flashCrash = detectFlashCrash(snapshots, instrument);
  if (flashCrash) patterns.push(flashCrash);

  const spreadAnomaly = detectSpreadAnomaly(currentSnap?.spread ?? 0, avgSpread, instrument);
  if (spreadAnomaly) patterns.push(spreadAnomaly);

  const liquidityVac = detectLiquidityVacuum(
    currentSnap?.spread ?? 0, avgSpread, currentSnap?.volume ?? 0, avgVolume
  );
  if (liquidityVac) patterns.push(liquidityVac);

  const fakeOut = detectNewsFakeOut(snapshots, instrument, newsTimestamp);
  if (fakeOut) patterns.push(fakeOut);

  const corrBreak = detectCorrelationBreak(goldChange, dxyChange);
  if (corrBreak) patterns.push(corrBreak);

  // Determine action
  const hasEmergency = patterns.some(p => p.severity === "EMERGENCY");
  const hasCritical = patterns.some(p => p.severity === "CRITICAL");
  const warningCount = patterns.filter(p => p.severity === "WARNING").length;

  let action: ShieldSignal["action"] = "ALLOW";
  let multiplier = 1.0;

  if (hasEmergency) {
    action = "CLOSE_ALL";
    multiplier = 0.0;
  } else if (hasCritical) {
    action = "BLOCK";
    multiplier = 0.0;
  } else if (warningCount >= 2) {
    action = "REDUCE";
    multiplier = 0.3;
  } else if (warningCount === 1) {
    action = "REDUCE";
    multiplier = 0.6;
  }

  return {
    safe: action === "ALLOW",
    multiplierOverride: multiplier,
    detectedPatterns: patterns,
    action,
  };
}
