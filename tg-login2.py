import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession

api_id = 27346428
api_hash = "474624b94fcf276b0f787d2061b1aa09"
phone = "+4917682209636"

async def main():
    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()

    # Send code
    result = await client.send_code_request(phone)
    print(f"Code gesendet! Hash: {result.phone_code_hash}")
    print("Warte 60s auf Code-Eingabe via code.txt...")

    # Wait for code file
    import time, os
    code_file = "C:\\signal-bot\\code.txt"
    if os.path.exists(code_file):
        os.remove(code_file)

    for i in range(120):  # 2 Minuten warten
        if os.path.exists(code_file):
            with open(code_file) as f:
                code = f.read().strip()
            if code:
                print(f"Code gefunden: {code}")
                try:
                    await client.sign_in(phone, code, phone_code_hash=result.phone_code_hash)
                    session_str = client.session.save()
                    with open("C:\\signal-bot\\telegram-session.txt", "w") as f:
                        f.write(session_str)
                    print(f"SESSION:{session_str[:50]}...")
                    print("ERFOLG! Session gespeichert!")
                except Exception as e:
                    print(f"Login fehlgeschlagen: {e}")
                break
        time.sleep(1)
    else:
        print("Timeout — kein Code erhalten")

    await client.disconnect()

asyncio.run(main())
