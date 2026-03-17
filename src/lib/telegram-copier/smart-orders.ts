// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — TELEGRAM SMART ORDER MANAGER
//
// Versteht kurze Trader-Nachrichten ("buy xau", "sl 2138")
// und macht daraus professionelle 4-Split Orders mit
// Trailing SL und Auto-Breakeven.
//
// Der Trader schreibt locker → das System handelt professionell.
// ═══════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface ActiveSignalGroup {
  id: string;
  channelId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;        // Actual fill price
  stopLoss: number | null;
  takeProfits: number[];     // [TP1, TP2, TP3]
  orders: SplitOrder[];      // 4 sub-orders
  status: "OPEN" | "PARTIAL" | "CLOSED";
  createdAt: Date;
  lastUpdate: Date;
  trailingSL: {
    active: boolean;
    distance: number | null;  // In points
    currentSL: number | null;
  };
  breakEven: {
    enabled: boolean;
    triggered: boolean;       // True after TP1 hit
    offsetPips: number;       // SL moves to entry + offset
  };
}

interface SplitOrder {
  orderId: string;         // MetaApi order ID
  lotPercent: number;      // 25% each
  lots: number;
  tp: number | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  role: "TP1" | "TP2" | "TP3" | "RUNNER";
}


// ─────────────────────────────────────────────────────────────
// SIGNAL PARSER — Versteht ALLES was ein Trader schreiben kann
// ─────────────────────────────────────────────────────────────

const PARSER_PROMPT = `Du bist ein Trading-Signal-Parser. Trader schreiben kurze, informelle Nachrichten. Extrahiere die Trade-Daten.

BEISPIELE die du verstehen musst:

"buy xau" → {"action":"BUY","symbol":"XAUUSD","entryPrice":null,"stopLoss":null,"takeProfits":[]}
"sell gold 2155" → {"action":"SELL","symbol":"XAUUSD","entryPrice":2155,"stopLoss":null,"takeProfits":[]}
"sl 2138" → {"action":"MODIFY","symbol":null,"stopLoss":2138,"takeProfits":[],"isModification":true}
"tp 2152 2158 2165" → {"action":"MODIFY","symbol":null,"stopLoss":null,"takeProfits":[2152,2158,2165],"isModification":true}
"sl 2138 tp 2152 2158 2165" → {"action":"MODIFY","symbol":null,"stopLoss":2138,"takeProfits":[2152,2158,2165],"isModification":true}
"close xau" → {"action":"CLOSE","symbol":"XAUUSD","isClose":true}
"close half" → {"action":"CLOSE","symbol":null,"isClose":true,"closePartial":50}
"move sl to 2145" → {"action":"MODIFY","symbol":null,"stopLoss":2145,"isModification":true}
"be" oder "breakeven" → {"action":"MODIFY","symbol":null,"moveToBreakeven":true,"isModification":true}
"buy us500 4520 sl 4500 tp 4550 4570" → komplettes Signal
"xau long" → {"action":"BUY","symbol":"XAUUSD"}
"gold short bei 2160" → {"action":"SELL","symbol":"XAUUSD","entryPrice":2160}
"🟢 XAUUSD BUY 2145.50" → {"action":"BUY","symbol":"XAUUSD","entryPrice":2145.50}

SYMBOL MAPPING:
"xau","gold","xauusd" → "XAUUSD"
"us500","spx","sp500","nas","nasdaq","us100" → jeweiliges Symbol
"eurusd","eu" → "EURUSD"
"gbpusd","gu","cable" → "GBPUSD"

REGELN:
- NUR JSON zurückgeben, kein anderer Text
- Wenn die Nachricht kein Signal ist → action: "UNKNOWN"
- Wenn nur SL oder TP → isModification: true (bezieht sich auf offenen Trade)
- entryPrice null = Market Order
- Mehrere TPs als Array
- confidence 0-100

JSON FORMAT:
{"action":"BUY|SELL|MODIFY|CLOSE|UNKNOWN","symbol":"XAUUSD"|null,"entryPrice":null|number,"stopLoss":null|number,"takeProfits":[],"isModification":false,"isClose":false,"closePartial":null,"moveToBreakeven":false,"confidence":85}`;


// ─────────────────────────────────────────────────────────────
// SMART ORDER MANAGER
// ─────────────────────────────────────────────────────────────

export class SmartOrderManager {
  // Active signal groups per channel
  private activeGroups: Map<string, ActiveSignalGroup> = new Map();
  private config: OrderManagerConfig;
  private metaApi: any; // MetaApi connection

  constructor(config: OrderManagerConfig, metaApi: any) {
    this.config = config;
    this.metaApi = metaApi;
  }

  // ── Main entry: Handle a parsed signal ────────────────────
  async handleSignal(parsed: any, channelId: string): Promise<string> {

    // 1. NEW TRADE (BUY/SELL)
    if (parsed.action === "BUY" || parsed.action === "SELL") {
      return await this.openNewGroup(parsed, channelId);
    }

    // 2. MODIFICATION (SL/TP update)
    if (parsed.isModification) {
      return await this.modifyActiveGroup(parsed, channelId);
    }

    // 3. CLOSE
    if (parsed.isClose) {
      return await this.closeActiveGroup(parsed, channelId);
    }

    return "IGNORED";
  }


  // ── Open 4 split orders ───────────────────────────────────
  private async openNewGroup(signal: any, channelId: string): Promise<string> {
    const symbol = signal.symbol;
    const direction = signal.action as "BUY" | "SELL";

    // Calculate total lot size
    const accountInfo = await this.metaApi.getAccountInformation();
    const balance = accountInfo.balance;
    const riskAmount = balance * (this.config.riskPercentPerTrade / 100);

    // Default SL distance if no SL given yet
    const defaultSLPips = this.config.defaultSLPips[symbol] || 50;
    const pipValue = symbol.includes("XAU") ? 0.1 : 0.0001;
    const pointValue = symbol.includes("XAU") ? 100 : 10;
    const totalLots = +(riskAmount / (defaultSLPips * pointValue)).toFixed(2);
    const lotPerOrder = +(totalLots / 4).toFixed(2);

    // Get current price for market order
    const price = await this.metaApi.getSymbolPrice(symbol);
    const entryPrice = signal.entryPrice || (direction === "BUY" ? price.ask : price.bid);

    // Create 4 orders
    const orders: SplitOrder[] = [];
    const roles: Array<"TP1" | "TP2" | "TP3" | "RUNNER"> = ["TP1", "TP2", "TP3", "RUNNER"];

    for (let i = 0; i < 4; i++) {
      const lots = i === 3
        ? +(totalLots - lotPerOrder * 3).toFixed(2) // Rest in runner
        : lotPerOrder;

      const tp = signal.takeProfits?.[i] || null;
      const sl = signal.stopLoss || null;

      let result;
      if (signal.entryPrice) {
        // Limit/Stop order
        if (direction === "BUY") {
          const type = signal.entryPrice < price.ask ? "ORDER_TYPE_BUY_LIMIT" : "ORDER_TYPE_BUY_STOP";
          result = await this.metaApi.createLimitBuyOrder(symbol, lots, signal.entryPrice, sl, tp, {
            comment: `GF:${roles[i]}:${channelId.slice(-6)}`,
          });
        } else {
          result = await this.metaApi.createLimitSellOrder(symbol, lots, signal.entryPrice, sl, tp, {
            comment: `GF:${roles[i]}:${channelId.slice(-6)}`,
          });
        }
      } else {
        // Market order
        if (direction === "BUY") {
          result = await this.metaApi.createMarketBuyOrder(symbol, lots, sl, tp, {
            comment: `GF:${roles[i]}:${channelId.slice(-6)}`,
          });
        } else {
          result = await this.metaApi.createMarketSellOrder(symbol, lots, sl, tp, {
            comment: `GF:${roles[i]}:${channelId.slice(-6)}`,
          });
        }
      }

      orders.push({
        orderId: result?.orderId || `pending-${i}`,
        lotPercent: 25,
        lots,
        tp,
        status: "OPEN",
        role: roles[i],
      });
    }

    // Store the group
    const groupId = `${channelId}-${symbol}-${Date.now()}`;
    const group: ActiveSignalGroup = {
      id: groupId,
      channelId,
      symbol,
      direction,
      entryPrice,
      stopLoss: signal.stopLoss || null,
      takeProfits: signal.takeProfits || [],
      orders,
      status: "OPEN",
      createdAt: new Date(),
      lastUpdate: new Date(),
      trailingSL: {
        active: this.config.trailingSLEnabled,
        distance: this.config.trailingSLDistance[symbol] || null,
        currentSL: signal.stopLoss || null,
      },
      breakEven: {
        enabled: this.config.breakEvenAfterTP1,
        triggered: false,
        offsetPips: this.config.breakEvenOffsetPips,
      },
    };

    this.activeGroups.set(this.groupKey(channelId, symbol), group);

    console.log(`[ORDER-MGR] Opened 4 orders: ${direction} ${symbol} ${totalLots}L (${lotPerOrder}x4)`);
    return `OPENED:${groupId}`;
  }


  // ── Modify existing group (SL/TP update from trader) ──────
  private async modifyActiveGroup(signal: any, channelId: string): Promise<string> {

    // Find the active group for this channel
    // If signal has no symbol, find the most recent open group
    let group: ActiveSignalGroup | undefined;

    if (signal.symbol) {
      group = this.activeGroups.get(this.groupKey(channelId, signal.symbol));
    } else {
      // Find most recent open group for this channel
      for (const [key, g] of this.activeGroups) {
        if (key.startsWith(channelId) && g.status !== "CLOSED") {
          group = g;
          break;
        }
      }
    }

    if (!group) {
      console.log("[ORDER-MGR] No active group found to modify");
      return "NO_GROUP";
    }

    // Move to breakeven
    if (signal.moveToBreakeven) {
      const beSL = group.direction === "BUY"
        ? group.entryPrice + (group.breakEven.offsetPips * 0.1)
        : group.entryPrice - (group.breakEven.offsetPips * 0.1);

      for (const order of group.orders) {
        if (order.status === "OPEN") {
          await this.metaApi.modifyPosition(order.orderId, beSL, order.tp);
        }
      }
      group.stopLoss = beSL;
      group.breakEven.triggered = true;
      console.log(`[ORDER-MGR] Moved SL to breakeven: ${beSL}`);
      return "BREAKEVEN";
    }

    // Update SL
    if (signal.stopLoss) {
      group.stopLoss = signal.stopLoss;
      group.trailingSL.currentSL = signal.stopLoss;
      for (const order of group.orders) {
        if (order.status === "OPEN") {
          await this.metaApi.modifyPosition(order.orderId, signal.stopLoss, order.tp);
        }
      }
      console.log(`[ORDER-MGR] SL updated to ${signal.stopLoss}`);
    }

    // Update TPs
    if (signal.takeProfits.length > 0) {
      group.takeProfits = signal.takeProfits;

      // Assign TPs to orders: TP1→Order1, TP2→Order2, TP3→Order3, Runner→no TP
      for (let i = 0; i < group.orders.length; i++) {
        const order = group.orders[i];
        if (order.status !== "OPEN") continue;

        if (order.role === "RUNNER") {
          // Runner has NO TP — only trailing SL
          await this.metaApi.modifyPosition(order.orderId, group.stopLoss, null);
          order.tp = null;
        } else {
          const tpIndex = ["TP1", "TP2", "TP3"].indexOf(order.role);
          const tp = signal.takeProfits[tpIndex] ?? signal.takeProfits[signal.takeProfits.length - 1];
          order.tp = tp;
          await this.metaApi.modifyPosition(order.orderId, group.stopLoss, tp);
        }
      }
      console.log(`[ORDER-MGR] TPs updated: ${signal.takeProfits.join(", ")}`);
    }

    group.lastUpdate = new Date();
    return "MODIFIED";
  }


  // ── Close group ───────────────────────────────────────────
  private async closeActiveGroup(signal: any, channelId: string): Promise<string> {
    let group: ActiveSignalGroup | undefined;

    if (signal.symbol) {
      group = this.activeGroups.get(this.groupKey(channelId, signal.symbol));
    } else {
      for (const [key, g] of this.activeGroups) {
        if (key.startsWith(channelId) && g.status !== "CLOSED") {
          group = g;
          break;
        }
      }
    }

    if (!group) return "NO_GROUP";

    if (signal.closePartial) {
      // Close partial (e.g. "close half")
      const toClose = Math.ceil(group.orders.filter(o => o.status === "OPEN").length * signal.closePartial / 100);
      let closed = 0;
      for (const order of group.orders) {
        if (order.status === "OPEN" && closed < toClose) {
          await this.metaApi.closePosition(order.orderId);
          order.status = "CLOSED";
          closed++;
        }
      }
      group.status = "PARTIAL";
      console.log(`[ORDER-MGR] Partial close: ${closed} orders`);
    } else {
      // Close all
      for (const order of group.orders) {
        if (order.status === "OPEN") {
          await this.metaApi.closePosition(order.orderId);
          order.status = "CLOSED";
        }
      }
      group.status = "CLOSED";
      console.log(`[ORDER-MGR] All orders closed for ${group.symbol}`);
    }

    return "CLOSED";
  }


  // ── Trailing SL + Auto Breakeven (runs on timer) ──────────
  async updateTrailingStops() {
    for (const [key, group] of this.activeGroups) {
      if (group.status === "CLOSED") continue;

      const price = await this.metaApi.getSymbolPrice(group.symbol);
      const currentPrice = group.direction === "BUY" ? price.bid : price.ask;

      // Check if TP1 was hit → move to breakeven
      if (group.breakEven.enabled && !group.breakEven.triggered && group.takeProfits[0]) {
        const tp1Hit = group.direction === "BUY"
          ? currentPrice >= group.takeProfits[0]
          : currentPrice <= group.takeProfits[0];

        if (tp1Hit) {
          const beSL = group.direction === "BUY"
            ? group.entryPrice + (group.breakEven.offsetPips * 0.1)
            : group.entryPrice - (group.breakEven.offsetPips * 0.1);

          // Move SL on remaining orders
          for (const order of group.orders) {
            if (order.status === "OPEN" && order.role !== "TP1") {
              try {
                await this.metaApi.modifyPosition(order.orderId, beSL, order.tp);
              } catch {} // Order might already be closed
            }
          }

          // Mark TP1 as closed
          const tp1Order = group.orders.find(o => o.role === "TP1");
          if (tp1Order) tp1Order.status = "CLOSED";

          group.stopLoss = beSL;
          group.breakEven.triggered = true;
          group.status = "PARTIAL";
          console.log(`[TRAIL] TP1 hit -> SL moved to BE: ${beSL}`);
        }
      }

      // Trailing SL on RUNNER
      if (group.trailingSL.active && group.trailingSL.distance && group.breakEven.triggered) {
        const runner = group.orders.find(o => o.role === "RUNNER" && o.status === "OPEN");
        if (!runner) continue;

        const trailDistance = group.trailingSL.distance;
        let newSL: number;

        if (group.direction === "BUY") {
          newSL = +(currentPrice - trailDistance).toFixed(2);
          if (group.trailingSL.currentSL && newSL > group.trailingSL.currentSL) {
            await this.metaApi.modifyPosition(runner.orderId, newSL, null);
            group.trailingSL.currentSL = newSL;
            group.stopLoss = newSL;
            console.log(`[TRAIL] Runner SL trailed to ${newSL}`);
          }
        } else {
          newSL = +(currentPrice + trailDistance).toFixed(2);
          if (group.trailingSL.currentSL && newSL < group.trailingSL.currentSL) {
            await this.metaApi.modifyPosition(runner.orderId, newSL, null);
            group.trailingSL.currentSL = newSL;
            group.stopLoss = newSL;
            console.log(`[TRAIL] Runner SL trailed to ${newSL}`);
          }
        }
      }
    }
  }

  private groupKey(channelId: string, symbol: string) {
    return `${channelId}:${symbol}`;
  }

  getActiveGroups() {
    return Array.from(this.activeGroups.values()).filter(g => g.status !== "CLOSED");
  }
}


// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

interface OrderManagerConfig {
  riskPercentPerTrade: number;    // z.B. 1% vom Balance
  defaultSLPips: Record<string, number>;  // Wenn Trader keinen SL gibt
  trailingSLEnabled: boolean;
  trailingSLDistance: Record<string, number>; // In Preis-Punkten
  breakEvenAfterTP1: boolean;
  breakEvenOffsetPips: number;    // SL = Entry + X pips
  maxOrdersPerSignal: number;     // 4
  lotSplitPercent: number[];      // [25, 25, 25, 25]
}

const DEFAULT_CONFIG: OrderManagerConfig = {
  riskPercentPerTrade: 1,         // 1% Risk pro Signal
  defaultSLPips: {
    "XAUUSD": 50,                 // $5 Bewegung als Default-SL
    "US500": 20,
    "EURUSD": 30,
    "GBPUSD": 35,
  },
  trailingSLEnabled: true,
  trailingSLDistance: {
    "XAUUSD": 3.0,               // $3 trailing distance
    "US500": 10,
    "EURUSD": 0.0020,
    "GBPUSD": 0.0025,
  },
  breakEvenAfterTP1: true,
  breakEvenOffsetPips: 2,         // SL → Entry + 2 pips
  maxOrdersPerSignal: 4,
  lotSplitPercent: [25, 25, 25, 25],
};

export { DEFAULT_CONFIG };
export type { OrderManagerConfig, ActiveSignalGroup, SplitOrder };
