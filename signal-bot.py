#!/usr/bin/env python3
"""
GoldFoundry Signal Bot — Python Telethon (STABIL)
Millisekunden Signal-Erkennung via events.NewMessage
Trades DIREKT via MetaApi REST API
"""
import asyncio
import json
import re
import time
import os
from telethon import TelegramClient, events
from telethon.sessions import StringSession
import aiohttp

# ── Config ──
API_ID = 27346428
API_HASH = "474624b94fcf276b0f787d2061b1aa09"
SB_URL = "https://exgmqztwuvwlncrmgmhq.supabase.co"
META_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai"

# Load from .env.local
env = {}
for path in ["C:\\signal-bot\\.env.local", ".env.local"]:
    try:
        with open(path) as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    env[k] = v
        break
    except: pass

SB_KEY = env.get("SUPABASE_SERVICE_KEY", "")
METAAPI_TOKEN = env.get("METAAPI_TOKEN", "")

# ── Symbol Map ──
SYMBOL_MAP = {
    "gold": "XAUUSD", "xau": "XAUUSD", "xauusd": "XAUUSD",
    "silver": "XAGUSD", "xagusd": "XAGUSD",
    "eurusd": "EURUSD", "gbpusd": "GBPUSD", "usdjpy": "USDJPY",
    "usdcad": "USDCAD", "usdchf": "USDCHF", "audusd": "AUDUSD",
    "nzdusd": "NZDUSD", "eurgbp": "EURGBP", "audnzd": "AUDNZD",
    "gbpjpy": "GBPJPY", "eurjpy": "EURJPY", "xagusd": "XAGUSD",
    "btcusd": "BTCUSD", "us500": "US500", "nas100": "NAS100",
}
SYM_PATTERN = "|".join(sorted(SYMBOL_MAP.keys(), key=len, reverse=True))

# ── Broker Symbol Cache ──
symbol_cache = {}

# ── Parser ──
def parse_signal(msg):
    m = msg.replace("\n", " ").strip()
    action = None
    if re.search(r"\b(buy|buying|long)\b", m, re.I): action = "BUY"
    elif re.search(r"\b(sell|selling|short)\b", m, re.I): action = "SELL"
    if not action: return None

    sym_match = re.search(f"({SYM_PATTERN})", m, re.I)
    if not sym_match: return None
    symbol = SYMBOL_MAP.get(sym_match.group(1).lower(), sym_match.group(1).upper())

    at_m = re.search(r"(?:at|@|entry[:\s]*)\s*(\d+(?:\.\d{1,5})?)", m, re.I)
    range_m = re.search(r"(\d{4,5}(?:\.\d{1,2})?)\s*[–\-]\s*(\d{4,5}(?:\.\d{1,2})?)", m)
    entry = float(at_m.group(1)) if at_m else (float(range_m.group(1)) + float(range_m.group(2))) / 2 if range_m else None

    sl_m = re.search(r"(?:SL|stop\s*loss|sl)[:\s]+(\d+(?:\.\d{1,5})?)", m, re.I)
    sl = float(sl_m.group(1)) if sl_m else None

    tp_matches = re.findall(r"(?:TP\d?|take\s*profit\d?|tp\d?)[:\s]+(\d+(?:\.\d{1,5})?)", m, re.I)
    tps = [float(t) for t in tp_matches]

    return {"action": action, "symbol": symbol, "entry": entry, "sl": sl, "tps": tps}

def is_likely_signal(text):
    l = text.lower()
    keywords = ["buy","sell","buying","selling","long","short","tp","sl","signal","gold","xau","entry","close","raus","profite"]
    return any(k in l for k in keywords)

# ── MetaApi ──
async def meta_fetch(session, url, method="GET", body=None):
    headers = {"auth-token": METAAPI_TOKEN, "Content-Type": "application/json"}
    async with session.request(method, url, headers=headers, json=body, timeout=aiohttp.ClientTimeout(total=15)) as r:
        return await r.json()

async def get_broker_symbol(session, account_id, symbol):
    key = f"{account_id}-{symbol}"
    if key in symbol_cache: return symbol_cache[key]
    try:
        syms = await meta_fetch(session, f"{META_BASE}/users/current/accounts/{account_id}/symbols")
        if isinstance(syms, list):
            names = [s.get("symbol", s) if isinstance(s, dict) else s for s in syms]
            found = next((n for n in names if n == symbol), None) or \
                    next((n for n in names if n == symbol + ".pro"), None) or \
                    next((n for n in names if n.startswith(symbol)), None)
            if found:
                symbol_cache[key] = found
                return found
    except: pass
    symbol_cache[key] = symbol
    return symbol

async def place_trade(session, account_id, signal, broker_symbol):
    is_buy = signal["action"] == "BUY"
    is_gold = "xau" in broker_symbol.lower() or "gold" in broker_symbol.lower()

    # Auto-SL
    if not signal["sl"]:
        try:
            tick = await meta_fetch(session, f"{META_BASE}/users/current/accounts/{account_id}/symbols/{broker_symbol}/current-price")
            price = tick.get("bid") or tick.get("ask", 0)
            if price:
                sl_dist = 10 if is_gold else 0.003
                signal["sl"] = round((price - sl_dist if is_buy else price + sl_dist), 2)
                signal["entry"] = signal["entry"] or price
                print(f"   🛡️ Auto-SL: {signal['sl']}")
        except: pass

    # Balance
    balance = 10000
    try:
        info = await meta_fetch(session, f"{META_BASE}/users/current/accounts/{account_id}/account-information")
        balance = info.get("equity") or info.get("balance", 10000)
    except: pass

    # Lots
    lots = 0.01
    if signal["sl"] and signal["entry"]:
        sl_dist = abs(signal["entry"] - signal["sl"])
        risk_per_lot = sl_dist * (100 if is_gold else 100000)
        if risk_per_lot > 0:
            lots = max(0.01, min(round(balance * 0.01 / risk_per_lot, 2), 2.0 if is_gold else 5.0))

    # Auto TPs
    tps = list(signal["tps"])
    if signal["sl"] and signal["entry"]:
        sl_dist = abs(signal["entry"] - signal["sl"])
        while len(tps) < 4:
            mult = [1.5, 2.5, 3.5, 5.0][len(tps)]
            tps.append(round((signal["entry"] + sl_dist * mult if is_buy else signal["entry"] - sl_dist * mult), 2))

    # 4-Split
    action_type = "ORDER_TYPE_BUY" if is_buy else "ORDER_TYPE_SELL"
    if len(tps) >= 4:
        splits = [{"p": 0.40, "tp": tps[0]}, {"p": 0.25, "tp": tps[1]}, {"p": 0.20, "tp": tps[2]}, {"p": 0.15, "tp": tps[3]}]
    else:
        splits = [{"p": 1.0, "tp": tps[0] if tps else None}]

    orders = [{"lots": max(0.01, round(lots * s["p"], 2)), "tp": s["tp"]} for s in splits if round(lots * s["p"], 2) >= 0.01]

    # Execute parallel
    executed = 0
    tasks = []
    for i, order in enumerate(orders):
        payload = {"actionType": action_type, "symbol": broker_symbol, "volume": order["lots"], "comment": f"TG-Signal TP{i+1}"}
        if signal["sl"]: payload["stopLoss"] = signal["sl"]
        if order["tp"]: payload["takeProfit"] = order["tp"]
        tasks.append(meta_fetch(session, f"{META_BASE}/users/current/accounts/{account_id}/trade", "POST", payload))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, dict) and (r.get("numericCode") == 0 or r.get("stringCode") in ("TRADE_RETCODE_DONE", "ERR_NO_ERROR")):
            executed += 1

    return executed

# ── Main ──
async def main():
    if not SB_KEY or not METAAPI_TOKEN:
        print("❌ ENV fehlt!")
        return

    # Get session from Supabase
    async with aiohttp.ClientSession() as http:
        headers = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}
        async with http.get(f"{SB_URL}/rest/v1/telegram_sessions?select=session_string&status=eq.connected&limit=1", headers=headers) as r:
            sessions = await r.json()
        if not sessions or not sessions[0].get("session_string"):
            print("❌ Keine Telegram-Session!")
            return
        session_str = sessions[0]["session_string"]

        # Get channel→account mapping
        async with http.get(f"{SB_URL}/rest/v1/telegram_active_channels?select=channel_id,channel_name,settings", headers=headers) as r:
            channels_db = await r.json()

        channel_account_map = {}
        for ch in (channels_db or []):
            linked_id = (ch.get("settings") or {}).get("linkedAccountId")
            if linked_id:
                async with http.get(f"{SB_URL}/rest/v1/slave_accounts?select=metaapi_account_id&id=eq.{linked_id}", headers=headers) as r:
                    accs = await r.json()
                if accs:
                    channel_account_map[ch["channel_id"]] = {"metaApiId": accs[0]["metaapi_account_id"], "name": ch.get("channel_name", "")}

    # Connect Telegram
    client = TelegramClient(StringSession(session_str), API_ID, API_HASH)
    await client.connect()

    if not await client.is_user_authorized():
        print("❌ Session nicht autorisiert!")
        return

    print("🚀 GoldFoundry Signal Bot — Python Telethon")
    print("═══════════════════════════════════════")
    print("  Millisekunden · Stabil · Kein Flood")

    # Find channels
    channel_ids = []
    async for dialog in client.iter_dialogs(limit=300):
        entity = dialog.entity
        if not entity: continue
        full_id = f"-100{entity.id}" if hasattr(entity, "megagroup") or hasattr(entity, "broadcast") else str(entity.id)
        if full_id in channel_account_map:
            acc = channel_account_map[full_id]
            print(f"  📢 {dialog.name} → {acc['metaApiId'][:8]}")
            channel_ids.append(entity)

    print(f"\n⚡ LIVE — {len(channel_ids)} Channels · Millisekunden\n")

    # Message handler
    @client.on(events.NewMessage(chats=channel_ids))
    async def handler(event):
        text = event.message.message
        if not text or not is_likely_signal(text):
            return

        signal = parse_signal(text)
        if not signal:
            return

        chat_id = str(event.chat_id)
        full_id = f"-100{chat_id}" if not chat_id.startswith("-") else chat_id
        # Try both formats
        acc = channel_account_map.get(full_id) or channel_account_map.get(f"-100{abs(event.chat_id)}")

        ts = time.strftime("%H:%M:%S")
        print(f"\n[{ts}] ⚡ {signal['action']} {signal['symbol']} | {event.chat.title}")
        print(f"   Entry:{signal['entry'] or 'Market'} SL:{signal['sl'] or 'auto'} TP:{','.join(str(t) for t in signal['tps']) or 'auto'}")

        if not acc:
            print("   ❌ Kein Account verknüpft!")
            return

        start = time.time()
        async with aiohttp.ClientSession() as http:
            broker_sym = await get_broker_symbol(http, acc["metaApiId"], signal["symbol"])
            executed = await place_trade(http, acc["metaApiId"], signal, broker_sym)

        ms = int((time.time() - start) * 1000)
        print(f"   {'🎯' if executed > 0 else '❌'} {executed} Order(s) in {ms}ms ({broker_sym})")

    # Keep running
    print("💚 Listening...")
    await client.run_until_disconnected()

if __name__ == "__main__":
    asyncio.run(main())
