// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/listener.ts — Telegram Channel Listener
// Verbindet sich mit Telegram, empfängt Signale, leitet sie weiter
// ═══════════════════════════════════════════════════════════════

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage, type NewMessageEvent } from "telegram/events";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { parseSignal, logSignal } from "./copier";
import { executeSignal } from "./executor";

const log = (level: string, msg: string, data?: any) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [TG-LISTENER] [${level}] ${msg}`, data ? JSON.stringify(data) : "");
};

// ── Singleton Client ──────────────────────────────────────────
let _client: TelegramClient | null = null;
let _running = false;

export function getTelegramClient(): TelegramClient | null {
  return _client;
}

export function isListenerRunning(): boolean {
  return _running;
}

// ── Start Listener ────────────────────────────────────────────
export async function startTelegramListener(): Promise<void> {
  if (_running) {
    log("WARN", "Telegram Listener läuft bereits");
    return;
  }

  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
  const apiHash = process.env.TELEGRAM_API_HASH || "";
  const session = process.env.TELEGRAM_SESSION || "";

  if (!apiId || !apiHash) {
    log("ERROR", "TELEGRAM_API_ID und TELEGRAM_API_HASH fehlen in .env.local");
    return;
  }

  try {
    const stringSession = new StringSession(session);
    _client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await _client.start({
      phoneNumber: async () => process.env.TELEGRAM_PHONE || "",
      password: async () => process.env.TELEGRAM_2FA_PASSWORD || "",
      phoneCode: async () => {
        // In Produktion: Code über API-Route oder Dashboard eingeben
        log("WARN", "Telegram benötigt Verifizierungscode — über /api/copier/telegram/verify einreichen");
        return "";
      },
      onError: (err) => log("ERROR", "Telegram Auth Error", { error: err.message }),
    });

    // Session-String speichern für Reconnect
    const newSession = _client.session.save() as unknown as string;
    if (newSession && newSession !== session) {
      log("INFO", "Neue Telegram-Session gespeichert. Bitte TELEGRAM_SESSION in .env.local aktualisieren.");
      log("INFO", `Session: ${newSession}`);
    }

    log("INFO", "Telegram Client verbunden!");

    // Aktive Channels aus DB laden und abonnieren
    await subscribeToChannels(_client);

    _running = true;
    log("INFO", "Telegram Listener gestartet — warte auf Signale...");
  } catch (err) {
    log("ERROR", "Telegram Listener Start fehlgeschlagen", { error: (err as Error).message });
    _client = null;
  }
}

// ── Subscribe to Channels ─────────────────────────────────────
async function subscribeToChannels(client: TelegramClient): Promise<void> {
  const db = createSupabaseAdmin();

  const { data: channels } = await db
    .from("telegram_active_channels")
    .select("channel_id, channel_name, status")
    .in("status", ["verified", "watching"]);

  if (!channels?.length) {
    log("WARN", "Keine aktiven Telegram-Channels in DB gefunden");
    return;
  }

  const channelIds = channels.map((c) => c.channel_id);
  log("INFO", `Abonniere ${channels.length} Channels`, { channels: channels.map((c) => c.channel_name) });

  // Event-Handler für neue Nachrichten
  client.addEventHandler(
    async (event: NewMessageEvent) => {
      await handleNewMessage(event, channelIds);
    },
    new NewMessage({ chats: channelIds })
  );
}

// ── Handle New Message ────────────────────────────────────────
async function handleNewMessage(event: NewMessageEvent, watchedChannels: string[]): Promise<void> {
  try {
    const message = event.message;
    if (!message?.text) return;

    const chatId = message.chatId?.toString();
    if (!chatId || !watchedChannels.includes(chatId)) return;

    const text = message.text.trim();
    if (text.length < 5) return; // Zu kurz für ein Signal

    log("INFO", `Neue Nachricht von Channel ${chatId}`, { text: text.slice(0, 100) });

    // 1. Signal parsen
    const signal = await parseSignal(text);

    if (signal.action === "UNKNOWN" || signal.confidence < 40) {
      log("INFO", `Kein Signal erkannt (action=${signal.action}, confidence=${signal.confidence})`);
      await logSignal(chatId, signal, text, message.id);
      return;
    }

    log("INFO", `Signal erkannt: ${signal.action} ${signal.symbol} @ ${signal.entryPrice}`, {
      confidence: signal.confidence,
      sl: signal.stopLoss,
      tps: signal.takeProfits,
    });

    // 2. Signal loggen (mit message.id für Verknüpfung mit Execution)
    await logSignal(chatId, signal, text, message.id);

    // 3. Signal ausführen (über alle verbundenen Slave-Accounts)
    const result = await executeSignal(signal, chatId, message.id);
    log("INFO", `Signal-Execution abgeschlossen`, result);
  } catch (err) {
    log("ERROR", "Nachrichtenverarbeitung fehlgeschlagen", { error: (err as Error).message });
  }
}

// ── Add Channel (zur Laufzeit) ────────────────────────────────
export async function addChannel(channelId: string, channelName: string): Promise<boolean> {
  const db = createSupabaseAdmin();

  // Channel in DB speichern
  const { error } = await db.from("telegram_active_channels").upsert({
    channel_id: channelId,
    channel_name: channelName,
    status: "watching",
    updated_at: new Date().toISOString(),
  }, { onConflict: "channel_id" });

  if (error) {
    log("ERROR", "Channel konnte nicht gespeichert werden", { error: error.message });
    return false;
  }

  // Listener neu laden, wenn Client läuft
  if (_client && _running) {
    await subscribeToChannels(_client);
  }

  log("INFO", `Channel hinzugefügt: ${channelName} (${channelId})`);
  return true;
}

// ── Remove Channel ────────────────────────────────────────────
export async function removeChannel(channelId: string): Promise<boolean> {
  const db = createSupabaseAdmin();

  const { error } = await db
    .from("telegram_active_channels")
    .update({ status: "blocked", updated_at: new Date().toISOString() })
    .eq("channel_id", channelId);

  if (error) {
    log("ERROR", "Channel konnte nicht entfernt werden", { error: error.message });
    return false;
  }

  log("INFO", `Channel deaktiviert: ${channelId}`);
  return true;
}

// ── Stop Listener ─────────────────────────────────────────────
export async function stopTelegramListener(): Promise<void> {
  if (_client) {
    await _client.disconnect();
    _client = null;
  }
  _running = false;
  log("INFO", "Telegram Listener gestoppt");
}
