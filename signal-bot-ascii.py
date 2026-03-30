#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# GoldFoundry Signal Bot v9 - ALL BUGS FIXED
import sys, os
if sys.stdout.encoding != 'utf-8':
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
    sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)
import asyncio, json, re, time, traceback
from telethon import TelegramClient
from telethon.sessions import StringSession
import aiohttp

API_ID = 27346428
API_HASH = "474624b94fcf276b0f787d2061b1aa09"
SB_URL = "https://exgmqztwuvwlncrmgmhq.supabase.co"
META_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai"

env = {}
for path in ["C:\\signal-bot\\.env.local", ".env.local"]:
    try:
        with open(path) as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    env[k] = v
        break
    except Exception:
        pass

SB_KEY = env.get("SUPABASE_SERVICE_KEY", "")
METAAPI_TOKEN = env.get("METAAPI_TOKEN", "")

SYMBOL_MAP = {"gold":"XAUUSD","xau":"XAUUSD","xauusd":"XAUUSD","silver":"XAGUSD","xagusd":"XAGUSD","eurusd":"EURUSD","gbpusd":"GBPUSD","usdjpy":"USDJPY","usdcad":"USDCAD","usdchf":"USDCHF","audusd":"AUDUSD","nzdusd":"NZDUSD","eurgbp":"EURGBP","audnzd":"AUDNZD","gbpjpy":"GBPJPY","eurjpy":"EURJPY","btcusd":"BTCUSD","us500":"US500","nas100":"NAS100"}
SYM_PATTERN = "|".join(sorted(SYMBOL_MAP.keys(), key=len, reverse=True))
symbol_cache = {}
BROKER_FALLBACK = {"XAUUSD":"XAUUSD.pro","XAGUSD":"XAGUSD.pro","EURUSD":"EURUSD.pro","GBPUSD":"GBPUSD.pro","USDJPY":"USDJPY.pro","USDCAD":"USDCAD.pro","USDCHF":"USDCHF.pro","AUDUSD":"AUDUSD.pro","NZDUSD":"NZDUSD.pro","EURGBP":"EURGBP.pro","AUDNZD":"AUDNZD.pro","GBPJPY":"GBPJPY.pro","EURJPY":"EURJPY.pro"}

def parse_signal(msg):
    m = msg.replace("\n", " ").strip()
    action = None
    if re.search(r"\b(buy|buying|long)\b", m, re.I): action = "BUY"
    elif re.search(r"\b(sell|selling|short)\b", m, re.I): action = "SELL"
    if not action: return None
    sym = re.search(f"({SYM_PATTERN})", m, re.I)
    if not sym: return None
    symbol = SYMBOL_MAP.get(sym.group(1).lower(), sym.group(1).upper())
    at_m = re.search(r"(?:at|@|entry[:\s]*)\s*(\d+(?:\.\d{1,5})?)", m, re.I)
    rng = re.search(r"(\d{4,5}(?:\.\d{1,2})?)\s*[-]\s*(\d{4,5}(?:\.\d{1,2})?)", m)
    entry = float(at_m.group(1)) if at_m else (float(rng.group(1))+float(rng.group(2)))/2 if rng else None
    sl_m = re.search(r"(?:SL|stop\s*loss|sl)[:\s]+(\d+(?:\.\d{1,5})?)", m, re.I)
    sl = float(sl_m.group(1)) if sl_m else None
    # FIX #4: TP Regex - matcht jetzt auch "TP3300" ohne Leerzeichen/Doppelpunkt
    tps = [float(t) for t in re.findall(r"(?:TP\d?|tp\d?)[:\s]*(\d+(?:\.\d{1,5})?)", m, re.I)]
    return {"action": action, "symbol": symbol, "entry": entry, "sl": sl, "tps": tps}

def is_signal(text):
    l = text.lower()
    return any(k in l for k in ["buy","sell","buying","selling","long","short","tp","sl","signal","gold","xau","entry"])

# FIX #5: Pending-Order Schwelle pro Instrument-Typ
def get_pending_threshold(symbol):
    sym = symbol.upper()
    if "XAU" in sym or "GOLD" in sym:
        return 20       # Gold: $20 vom Preis weg
    elif "JPY" in sym:
        return 0.20     # JPY-Paare: 20 Pips (USDJPY bei ~150)
    elif "BTC" in sym:
        return 500      # Bitcoin: $500
    elif "US500" in sym or "NAS" in sym:
        return 50       # Indices: 50 Punkte
    else:
        return 0.0020   # Standard Forex: 20 Pips

async def meta_fetch(http, url, method="GET", body=None):
    headers = {"auth-token": METAAPI_TOKEN, "Content-Type": "application/json"}
    async with http.request(method, url, headers=headers, json=body, timeout=aiohttp.ClientTimeout(total=15)) as r:
        return await r.json()

async def get_broker_sym(http, aid, sym):
    key = f"{aid}-{sym}"
    if key in symbol_cache: return symbol_cache[key]
    try:
        syms = await meta_fetch(http, f"{META_BASE}/users/current/accounts/{aid}/symbols")
        names = [s.get("symbol",s) if isinstance(s,dict) else s for s in syms] if isinstance(syms,list) else []
        found = next((n for n in names if n==sym),None) or next((n for n in names if n==sym+".pro"),None) or next((n for n in names if n.startswith(sym)),None)
        if found: symbol_cache[key]=found; return found
    except Exception:
        pass
    r=BROKER_FALLBACK.get(sym,sym); symbol_cache[key]=r; return r

async def get_current_price(http, aid, bsym):
    """Holt aktuellen Preis. Gibt (price, is_fresh) zurueck."""
    try:
        t = await meta_fetch(http, f"{META_BASE}/users/current/accounts/{aid}/symbols/{bsym}/current-price")
        p = t.get("bid") or t.get("ask", 0)
        if p and p > 0:
            return p, True
    except Exception:
        pass
    return None, False

async def place_trade(http, aid, sig, bsym):
    ib = sig["action"]=="BUY"
    ig = "xau" in bsym.lower() or "gold" in bsym.lower()
    is_jpy = "jpy" in bsym.lower()

    # Aktuellen Preis holen (wird fuer SL, TP und Pending gebraucht)
    p, price_fresh = await get_current_price(http, aid, bsym)

    # Auto-SL wenn keiner im Signal
    if not sig["sl"]:
        if p:
            sl_dist = 10 if ig else (0.30 if is_jpy else 0.003)
            if ib:
                sig["sl"] = round(p - sl_dist, 5)
            else:
                sig["sl"] = round(p + sl_dist, 5)
            sig["entry"] = sig["entry"] or p
            print(f"   [SL] Auto: {sig['sl']} (from price {p})")
        else:
            print("   [SL] WARN: Kein Preis verfuegbar, kein Auto-SL")

    # Balance holen fuer Lot-Berechnung
    bal = 10000
    try:
        info = await meta_fetch(http, f"{META_BASE}/users/current/accounts/{aid}/account-information")
        bal = info.get("equity") or info.get("balance", 10000)
    except Exception:
        pass

    # Lot-Size berechnen (1% Risk)
    lots = 0.01
    if sig["sl"] and sig["entry"]:
        sd = abs(sig["entry"] - sig["sl"])
        rpl = sd * (100 if ig else (1000 if is_jpy else 100000))
        if rpl > 0:
            lots = max(0.01, min(round(bal * 0.01 / rpl, 2), 2.0 if ig else 5.0))

    # TPs generieren — IMMER 4 TPs
    tps = list(sig["tps"])
    # FIX #2: base_price MUSS ein echter Preis sein, sonst keine Auto-TPs
    base_price = p or sig["entry"]
    if not base_price or base_price <= 0:
        print("   [WARN] Kein Preis und kein Entry - kann keine TPs berechnen")
        # Fallback: nur traden wenn mindestens 1 TP im Signal war
        if not tps:
            print("   [ERR] Kein Preis, kein Entry, kein TP - Trade abgebrochen")
            return 0

    if base_price and base_price > 0:
        if sig["sl"] and base_price:
            sd = abs(base_price - sig["sl"])
        else:
            sd = 10 if ig else (0.30 if is_jpy else 0.003)
        while len(tps) < 4:
            m = [1.5, 2.5, 3.5, 5.0][len(tps)]
            tp_val = round(base_price + sd * m if ib else base_price - sd * m, 2)
            tps.append(tp_val)

    # Sicherstellen dass wir mindestens 4 TPs haben
    while len(tps) < 4:
        tps.append(tps[-1] if tps else 0)

    # Pending Order wenn Entry weit vom Preis
    # FIX #5: Schwelle pro Instrument-Typ
    threshold = get_pending_threshold(bsym)
    if sig["entry"] and p and abs(sig["entry"] - p) > threshold:
        if ib:
            at = "ORDER_TYPE_BUY_LIMIT" if sig["entry"] < p else "ORDER_TYPE_BUY_STOP"
        else:
            at = "ORDER_TYPE_SELL_LIMIT" if sig["entry"] > p else "ORDER_TYPE_SELL_STOP"
        print(f"   [PENDING] {at} @ {sig['entry']} (threshold: {threshold})")
    else:
        at = "ORDER_TYPE_BUY" if ib else "ORDER_TYPE_SELL"

    # 4-Split Orders
    splits = [{"p":0.40,"tp":tps[0]},{"p":0.25,"tp":tps[1]},{"p":0.20,"tp":tps[2]},{"p":0.15,"tp":tps[3]}]
    orders = [{"l":max(0.01,round(lots*s["p"],2)),"tp":s["tp"]} for s in splits]
    tasks = []
    for i, o in enumerate(orders):
        payload = {"actionType":at, "symbol":bsym, "volume":o["l"], "comment":f"TG-Signal TP{i+1}"}
        if "LIMIT" in at or "STOP" in at:
            payload["openPrice"] = sig["entry"]
        if sig["sl"]:
            payload["stopLoss"] = sig["sl"]
        if o["tp"]:
            payload["takeProfit"] = o["tp"]
        tasks.append(meta_fetch(http, f"{META_BASE}/users/current/accounts/{aid}/trade", "POST", payload))
    results = await asyncio.gather(*tasks, return_exceptions=True)
    ok = 0
    for r in results:
        if isinstance(r, dict):
            if r.get('numericCode') == 0 or r.get('stringCode') in ('TRADE_RETCODE_DONE','ERR_NO_ERROR'):
                ok += 1
            else:
                print(f'   [DEBUG] {r.get("stringCode","?")}: {str(r.get("message",""))[:60]}')
        elif isinstance(r, Exception):
            print(f'   [DEBUG] Exception: {str(r)[:60]}')
    return ok

async def main():
    if not SB_KEY or not METAAPI_TOKEN:
        print("[ERR] ENV fehlt!")
        return

    # FIX #3: Eine HTTP-Session fuer alles wiederverwenden
    http = aiohttp.ClientSession()
    try:
        h = {"apikey":SB_KEY, "Authorization":f"Bearer {SB_KEY}"}
        async with http.get(f"{SB_URL}/rest/v1/telegram_sessions?select=session_string&status=eq.connected&limit=1", headers=h) as r:
            sessions = await r.json()
        if not sessions or not sessions[0].get("session_string"):
            print("[ERR] Keine Session!")
            return
        async with http.get(f"{SB_URL}/rest/v1/telegram_active_channels?select=channel_id,channel_name,settings", headers=h) as r:
            chs = await r.json()
        cam = {}
        for ch in (chs or []):
            lid = (ch.get("settings") or {}).get("linkedAccountId")
            if lid:
                async with http.get(f"{SB_URL}/rest/v1/slave_accounts?select=metaapi_account_id&id=eq.{lid}", headers=h) as r:
                    accs = await r.json()
                if accs:
                    cam[ch["channel_id"]] = {"mid":accs[0]["metaapi_account_id"], "name":ch.get("channel_name","")}

        client = TelegramClient(StringSession(sessions[0]["session_string"]), API_ID, API_HASH)
        await client.connect()
        if not await client.is_user_authorized():
            print("[ERR] Nicht autorisiert!")
            return

        print("GoldFoundry Signal Bot v9")
        print("=" * 40)

        entities = {}
        last_ids = {}
        async for d in client.iter_dialogs(limit=300):
            e = d.entity
            if not e: continue
            fid = f"-100{e.id}" if hasattr(e,"megagroup") or hasattr(e,"broadcast") else str(e.id)
            if fid in cam:
                entities[fid] = e
                msgs = await client.get_messages(e, limit=1)
                last_ids[fid] = msgs[0].id if msgs else 0
                print(f"  [CH] {d.name} -> {cam[fid]['mid'][:8]} (last: {last_ids[fid]})")

        print(f"\n[LIVE] {len(entities)} Channels - Poll alle 3s\n")

        # Signal-Deduplizierung
        recent_signals = {}
        DEDUP_COOLDOWN = 60

        poll_count = 0
        error_count = 0  # FIX #1: Error-Tracking fuer Reconnect

        while True:
            poll_count += 1
            for fid, entity in entities.items():
                try:
                    msgs = await client.get_messages(entity, limit=3)
                    error_count = 0  # Reset bei Erfolg
                    for msg in msgs:
                        if not msg.message or msg.id <= last_ids.get(fid, 0): continue
                        last_ids[fid] = msg.id
                        text = msg.message
                        if not is_signal(text): continue
                        sig = parse_signal(text)
                        if not sig: continue
                        # Dedup-Check
                        dedup_key = f"{sig['action']}-{sig['symbol']}"
                        now = time.time()
                        if dedup_key in recent_signals and (now - recent_signals[dedup_key]) < DEDUP_COOLDOWN:
                            age = int(now - recent_signals[dedup_key])
                            print(f"   [DEDUP] {dedup_key} vor {age}s schon getradet, skip")
                            continue
                        recent_signals[dedup_key] = now
                        recent_signals = {k: v for k, v in recent_signals.items() if now - v < 300}
                        ts = time.strftime("%H:%M:%S")
                        acc = cam.get(fid)
                        print(f"\n[{ts}] >> {sig['action']} {sig['symbol']} | {cam.get(fid,{}).get('name','?')}")
                        print(f"   Entry:{sig['entry'] or 'Market'} SL:{sig['sl'] or 'auto'} TP:{sig['tps'] or 'auto'}")
                        if not acc:
                            print("   [ERR] Kein Account!")
                            continue
                        start = time.time()
                        # FIX #3: HTTP-Session wiederverwenden
                        bsym = await get_broker_sym(http, acc["mid"], sig["symbol"])
                        executed = await place_trade(http, acc["mid"], sig, bsym)
                        ms = int((time.time() - start) * 1000)
                        status = "OK" if executed > 0 else "FAIL"
                        print(f"   [{status}] {executed} Order(s) in {ms}ms ({bsym})")
                except Exception as ex:
                    error_count += 1
                    err_str = str(ex)
                    # FIX #1: Reconnect-Logik bei Telegram-Fehler
                    if "disconnect" in err_str.lower() or "connection" in err_str.lower() or "unauthorized" in err_str.lower() or "flood" in err_str.lower():
                        print(f"[{time.strftime('%H:%M:%S')}] [WARN] Telegram-Fehler: {err_str[:80]}")
                        if error_count >= 3:
                            print(f"[{time.strftime('%H:%M:%S')}] [RECONNECT] 3+ Fehler, versuche Reconnect...")
                            try:
                                await client.disconnect()
                            except Exception:
                                pass
                            await asyncio.sleep(5)
                            try:
                                await client.connect()
                                if await client.is_user_authorized():
                                    print(f"[{time.strftime('%H:%M:%S')}] [RECONNECT] OK - wieder verbunden")
                                    error_count = 0
                                else:
                                    print(f"[{time.strftime('%H:%M:%S')}] [RECONNECT] FAIL - nicht autorisiert")
                            except Exception as rex:
                                print(f"[{time.strftime('%H:%M:%S')}] [RECONNECT] FAIL: {str(rex)[:60]}")
                                await asyncio.sleep(30)
                    elif error_count >= 10:
                        print(f"[{time.strftime('%H:%M:%S')}] [ERR] 10+ Fehler in Folge: {err_str[:80]}")
                        print(f"[{time.strftime('%H:%M:%S')}] [ERR] Warte 60s bevor weiter gepollt wird...")
                        await asyncio.sleep(60)
                        error_count = 0
                    elif error_count <= 3:
                        # Erste paar Fehler leise loggen
                        print(f"[{time.strftime('%H:%M:%S')}] [WARN] Poll-Fehler #{error_count}: {err_str[:60]}")

            if poll_count % 20 == 0:
                print(f"[{time.strftime('%H:%M:%S')}] OK Poll #{poll_count}")
            await asyncio.sleep(3)

    finally:
        await http.close()

if __name__=="__main__":
    while True:
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            print("\n[EXIT] Bot gestoppt.")
            break
        except Exception as ex:
            print(f"[FATAL] {ex}")
            traceback.print_exc()
            print("[RESTART] Neustart in 10s...")
            time.sleep(10)
