// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/types.ts — Telegram Copier Types
// ═══════════════════════════════════════════════════════════════

export interface ParsedSignal {
  action: 'BUY' | 'SELL' | 'MODIFY' | 'CLOSE' | 'UNKNOWN';
  symbol: string | null;
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfits: number[];
  isModification: boolean;
  isClose: boolean;
  closePartial: number | null;
  moveToBreakeven: boolean;
  confidence: number;
}

export interface TelegramChannel {
  id: string;
  channelId: string;
  channelName: string;
  status: 'active' | 'inactive';
  signalsReceived: number;
  signalsExecuted: number;
  winRate: number | null;
  settings: { autoExecute: boolean; riskPercent: number };
}

export interface SmartOrder {
  symbol: string;
  action: 'BUY' | 'SELL';
  lots: number;
  stopLoss: number;
  takeProfit: number;
  splitPercent: number;
  label: string;
}

export interface TradeDecision {
  decision: 'HOLD' | 'TIGHTEN_SL' | 'PARTIAL_CLOSE' | 'MOVE_BE' | 'CLOSE_ALL';
  newSL: number | null;
  closePercent: number | null;
  confidence: number;
  reason: string;
}
