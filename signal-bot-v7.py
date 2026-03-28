#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
"""
GoldFoundry Signal Bot v7 - Python Telethon POLL
getMessages() alle 3s statt EventHandler (funktioniert IMMER)
"""
import asyncio, json, re, time, os, aiohttp
from telethon import TelegramClient
from telethon.sessions import StringSession

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
    except: pass

SB_KEY = env.get("SUPABASE_SERVICE_KEY", "")
METAAPI_TOKEN = env.get("METAAPI_TOKEN", "")

SYMBOL_MAP = {"gold":"XAUUSD","xau":"XAUUSD","xauusd":"XAUUSD","silver":"XAGUSD","xagusd":"XAGUSD","eurusd":"EURUSD","gbpusd":"GBPUSD","usdjpy":"USDJPY","usdcad":"USDCAD","usdchf":"USDCHF","audusd":"AUDUSD","nzdusd":"NZDUSD","eurgbp":"EURGBP","audnzd":"AUDNZD","gbpjpy":"GBPJPY","eurjpy":"EURJPY","btcusd":"BTCUSD","us500":"US500","nas100":"NAS100"}
SYM_PATTERN = "|".join(sorted(SYMBOL_MAP.keys(), key=len, reverse=True))
symbol_cache = {}
# TagMarket (TMFinancials) broker symbols - hardcoded fallback
BROKER_FALLBACK = {'XAUUSD':'XAUUSD.pro','XAGUSD':'XAGUSD.pro','EURUSD':'EURUSD.pro','GBPUSD':'GBPUSD.pro','USDJPY':'USDJPY.pro','USDCAD':'USDCAD.pro','USDCHF':'USDCHF.pro','AUDUSD':'AUDUSD.pro','NZDUSD':'NZDUSD.pro','EURGBP':'EURGBP.pro','AUDNZD':'AUDNZD.pro','GBPJPY':'GBPJPY.pro','EURJPY':'EURJPY.pro'}

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
    tps = [float(t) for t in re.findall(r"(?:TP\d?|tp\d?)[:\s]+(\d+(?:\.\d{1,5})?)", m, re.I)]
    return {"action": action, "symbol": symbol, "entry": entry, "sl": sl, "tps": tps}

def is_signal(text):
    l = text.lower()
    return any(k in l for k in ["buy","sell","buying","selling","long","short","tp","sl","signal","gold","xau","entry"])

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
    except: pass
    r=BROKER_FALLBACK.get(sym,sym); symbol_cache[key]=r; return r

async def place_trade(http, aid, sig, bsym):
    ib = sig["action"]=="BUY"
    ig = "xau" in bsym.lower() or "gold" in bsym.lower()
    if not sig["sl"]:
        try:
            t = await meta_fetch(http, f"{META_BASE}/users/current/accounts/{aid}/symbols/{bsym}/current-price")
            p = t.get("bid") or t.get("ask",0)
            if p:
                sig["sl"]=round((p-10 if ib else p+10) if ig else (p-0.003 if ib else p+0.003),5)
                sig["entry"]=sig["entry"] or p
                print(f"   [SL] Auto: {sig['sl']}")
        except: pass
    bal=10000
    try:
        info=await meta_fetch(http,f"{META_BASE}/users/current/accounts/{aid}/account-information")
        bal=info.get("equity") or info.get("balance",10000)
    except: pass
    lots=0.01
    if sig["sl"] and sig["entry"]:
        sd=abs(sig["entry"]-sig["sl"])
        rpl=sd*(100 if ig else 100000)
        if rpl>0: lots=max(0.01,min(round(bal*0.01/rpl,2),2.0 if ig else 5.0))
    tps=list(sig["tps"])
    if sig["sl"] and sig["entry"]:
        sd=abs(sig["entry"]-sig["sl"])
        while len(tps)<4:
            m=[1.5,2.5,3.5,5.0][len(tps)]
            tps.append(round((sig["entry"]+sd*m if ib else sig["entry"]-sd*m),2))
    at="ORDER_TYPE_BUY" if ib else "ORDER_TYPE_SELL"
    splits=[{"p":0.40,"tp":tps[0]},{"p":0.25,"tp":tps[1]},{"p":0.20,"tp":tps[2]},{"p":0.15,"tp":tps[3]}] if len(tps)>=4 else [{"p":1.0,"tp":tps[0] if tps else None}]
    orders=[{"l":max(0.01,round(lots*s["p"],2)),"tp":s["tp"]} for s in splits if round(lots*s["p"],2)>=0.01]
    tasks=[]
    for i,o in enumerate(orders):
        payload={"actionType":at,"symbol":bsym,"volume":o["l"],"comment":f"TG-Signal TP{i+1}"}
        if sig["sl"]: payload["stopLoss"]=sig["sl"]
        if o["tp"]: payload["takeProfit"]=o["tp"]
        tasks.append(meta_fetch(http,f"{META_BASE}/users/current/accounts/{aid}/trade","POST",payload))
    results=await asyncio.gather(*tasks,return_exceptions=True)
    return sum(1 for r in results if isinstance(r,dict) and (r.get("numericCode")==0 or r.get("stringCode") in ("TRADE_RETCODE_DONE","ERR_NO_ERROR")))

async def main():
    if not SB_KEY or not METAAPI_TOKEN: print("[ERR] ENV fehlt!"); return
    async with aiohttp.ClientSession() as http:
        h={"apikey":SB_KEY,"Authorization":f"Bearer {SB_KEY}"}
        async with http.get(f"{SB_URL}/rest/v1/telegram_sessions?select=session_string&status=eq.connected&limit=1",headers=h) as r: sessions=await r.json()
        if not sessions or not sessions[0].get("session_string"): print("[ERR] Keine Session!"); return
        async with http.get(f"{SB_URL}/rest/v1/telegram_active_channels?select=channel_id,channel_name,settings",headers=h) as r: chs=await r.json()
        cam={}
        for ch in (chs or []):
            lid=(ch.get("settings") or {}).get("linkedAccountId")
            if lid:
                async with http.get(f"{SB_URL}/rest/v1/slave_accounts?select=metaapi_account_id&id=eq.{lid}",headers=h) as r: accs=await r.json()
                if accs: cam[ch["channel_id"]]={"mid":accs[0]["metaapi_account_id"],"name":ch.get("channel_name","")}

    client=TelegramClient(StringSession(sessions[0]["session_string"]),API_ID,API_HASH)
    await client.connect()
    if not await client.is_user_authorized(): print("[ERR] Nicht autorisiert!"); return

    print("GoldFoundry Signal Bot v7 - Python POLL")
    print("=" * 40)

    # Resolve channel entities
    entities={}
    last_ids={}
    async for d in client.iter_dialogs(limit=300):
        e=d.entity
        if not e: continue
        fid=f"-100{e.id}" if hasattr(e,"megagroup") or hasattr(e,"broadcast") else str(e.id)
        if fid in cam:
            entities[fid]=e
            # Get last message ID
            msgs=await client.get_messages(e,limit=1)
            last_ids[fid]=msgs[0].id if msgs else 0
            print(f"  [CH] {d.name} -> {cam[fid]['mid'][:8]} (last: {last_ids[fid]})")

    print(f"\n[LIVE] {len(entities)} Channels - Poll alle 3s\n")

    while True:
        for fid,entity in entities.items():
            try:
                msgs=await client.get_messages(entity,limit=3)
                for msg in msgs:
                    if not msg.message or msg.id<=last_ids.get(fid,0): continue
                    last_ids[fid]=msg.id
                    text=msg.message
                    if not is_signal(text): continue
                    sig=parse_signal(text)
                    if not sig: continue
                    ts=time.strftime("%H:%M:%S")
                    acc=cam.get(fid)
                    print(f"\n[{ts}] [SIGNAL] {sig['action']} {sig['symbol']} | {cam.get(fid,{}).get('name','?')}")
                    print(f"   Entry:{sig['entry'] or 'Market'} SL:{sig['sl'] or 'auto'} TP:{sig['tps'] or 'auto'}")
                    if not acc: print("   [ERR] Kein Account!"); continue
                    start=time.time()
                    async with aiohttp.ClientSession() as http2:
                        bsym=await get_broker_sym(http2,acc["mid"],sig["symbol"])
                        executed=await place_trade(http2,acc["mid"],sig,bsym)
                    ms=int((time.time()-start)*1000)
                    print(f"   [{'HIT' if executed>0 else 'ERR'}] {executed} Order(s) in {ms}ms ({bsym})")
            except Exception as ex:
                pass  # Silent retry next poll
        await asyncio.sleep(3)

if __name__=="__main__":
    asyncio.run(main())
