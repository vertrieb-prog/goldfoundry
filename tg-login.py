import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession
import sys

api_id = 27346428
api_hash = "474624b94fcf276b0f787d2061b1aa09"
phone = "+4917682209636"

async def main():
    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()

    if len(sys.argv) > 1:
        code = sys.argv[1]
        phone_hash = sys.argv[2] if len(sys.argv) > 2 else ""
        await client.sign_in(phone, code, phone_code_hash=phone_hash)
        session_str = client.session.save()
        print(f"SESSION:{session_str}")
        with open("telegram-session.txt", "w") as f:
            f.write(session_str)
        print("Session gespeichert!")
    else:
        result = await client.send_code_request(phone)
        print(f"HASH:{result.phone_code_hash}")
        print(f"Code gesendet an {phone}!")

    await client.disconnect()

asyncio.run(main())
