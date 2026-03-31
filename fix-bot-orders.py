"""Fix bot.py: Change parallel order placement to sequential with retry"""
import re

c = open(r'C:\signal-bot\bot.py', 'rb').read()

# Find and replace the parallel gather section
old = b'tasks = []\n    for i, o in enumerate(orders):'
old_cr = b'tasks = []\r\n    for i, o in enumerate(orders):'

# Build the new sequential code
new_code = b"""ok = 0
    for i, o in enumerate(orders):
        payload = {"actionType":at, "symbol":bsym, "volume":o["l"], "comment":f"TG-Signal TP{i+1}"}
        if "LIMIT" in at or "STOP" in at:
            payload["openPrice"] = sig["entry"]
        if sig["sl"]:
            payload["stopLoss"] = sig["sl"]
        if o["tp"]:
            payload["takeProfit"] = o["tp"]
        # Sequentiell mit Retry statt parallel (verhindert INVALID_STOPS durch Race Condition)
        for attempt in range(2):
            try:
                r = await meta_fetch(http, f"{META_BASE}/users/current/accounts/{aid}/trade", "POST", payload)
                if isinstance(r, dict) and (r.get('numericCode') == 0 or r.get('stringCode') in ('TRADE_RETCODE_DONE','ERR_NO_ERROR')):
                    ok += 1
                    break
                else:
                    err_msg = r.get("stringCode","?") if isinstance(r,dict) else str(r)
                    print(f"   [DEBUG] TP{i+1} Attempt {attempt+1}: {err_msg}")
                    if attempt == 0:
                        await asyncio.sleep(0.3)  # Kurz warten vor Retry
            except Exception as ex:
                print(f"   [DEBUG] TP{i+1} Exception: {str(ex)[:60]}")
                if attempt == 0:
                    await asyncio.sleep(0.3)
    return ok"""

# Remove everything from "tasks = []" to "return ok" and replace
# First find the start
if old_cr in c:
    start = c.find(old_cr)
elif old in c:
    start = c.find(old)
else:
    print("Pattern not found, trying regex")
    start = -1

if start >= 0:
    # Find "return ok" after start
    end_marker = b'return ok'
    end = c.find(end_marker, start)
    if end >= 0:
        end += len(end_marker)
        old_section = c[start:end]
        print(f"Found section: {len(old_section)} bytes at pos {start}")
        c = c[:start] + new_code.replace(b'\n', b'\r\n') + c[end:]
        open(r'C:\signal-bot\bot.py', 'wb').write(c)
        # Verify
        if b'Sequentiell mit Retry' in open(r'C:\signal-bot\bot.py','rb').read():
            print("SUCCESS: Sequential orders with retry")
        else:
            print("FAILED: Patch not applied")
    else:
        print("Could not find 'return ok' marker")
else:
    print("Could not find 'tasks = []' marker")
