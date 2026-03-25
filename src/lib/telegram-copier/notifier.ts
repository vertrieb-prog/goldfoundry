// ═══════════════════════════════════════════════════════════════
// Trade Execution Notifier
// Logs trade notifications to telegram_signals execution_result
// and sends Telegram Bot notifications if configured
// ═══════════════════════════════════════════════════════════════

const log = (level: string, msg: string) => {
  console.log(`[${new Date().toISOString()}] [NOTIFIER] [${level}] ${msg}`);
};

export interface TradeNotification {
  userId: string;
  action: string;
  symbol: string;
  lots: number;
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfits: number[];
  orderId: string;
  accountName: string;
  channelName: string;
  success: boolean;
  error?: string;
}

/**
 * Format a trade notification into a readable message
 */
function formatTradeMessage(n: TradeNotification): string {
  const emoji = n.success ? "✅" : "❌";
  const status = n.success ? "EXECUTED" : "FAILED";
  const lines = [
    `${emoji} Trade ${status}`,
    ``,
    `${n.action} ${n.symbol}`,
    `Lots: ${n.lots}`,
  ];

  if (n.entryPrice) lines.push(`Entry: ${n.entryPrice}`);
  if (n.stopLoss) lines.push(`SL: ${n.stopLoss}`);
  if (n.takeProfits.length > 0) {
    lines.push(`TP: ${n.takeProfits.join(" / ")}`);
  }
  if (n.orderId) lines.push(`Order: ${n.orderId}`);
  lines.push(`Account: ${n.accountName}`);
  lines.push(`Channel: ${n.channelName}`);

  if (!n.success && n.error) {
    lines.push(`Error: ${n.error}`);
  }

  return lines.join("\n");
}

/**
 * Send a trade notification via Telegram Bot API (if configured)
 * and return the formatted message for DB storage.
 */
export async function sendTradeNotification(
  params: TradeNotification
): Promise<{ message: string; telegramSent: boolean }> {
  const message = formatTradeMessage(params);

  let telegramSent = false;

  // Try sending via Telegram Bot API if token and chat ID are configured
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_NOTIFY_CHAT_ID;

  if (botToken && chatId) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
          }),
          signal: AbortSignal.timeout(5000),
        }
      );

      if (res.ok) {
        telegramSent = true;
        log("INFO", `Telegram notification sent for ${params.symbol}`);
      } else {
        const body = await res.text();
        log("WARN", `Telegram Bot API error: ${res.status} ${body}`);
      }
    } catch (err: any) {
      log("WARN", `Telegram notification failed: ${err.message}`);
    }
  } else {
    log("INFO", `No TELEGRAM_BOT_TOKEN/TELEGRAM_NOTIFY_CHAT_ID — skipping Telegram send`);
  }

  return { message, telegramSent };
}
