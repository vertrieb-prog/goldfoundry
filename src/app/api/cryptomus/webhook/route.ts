export const dynamic = "force-dynamic";
// src/app/api/cryptomus/webhook/route.ts
import { handleCryptomusWebhook } from "@/lib/payments/cryptomus-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sign = request.headers.get("sign") ?? "";
    const result = await handleCryptomusWebhook(body, sign);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
