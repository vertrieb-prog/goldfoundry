export const dynamic = "force-dynamic";
// POST /api/telegram/parse-preview — Live-Preview: Signal parsen ohne auszuführen
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { parseSignal } from "@/lib/telegram-copier/parser";

const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(userId: string, maxPerMinute = 30): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter(t => now - t < 60000);
  if (recent.length >= maxPerMinute) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: "Zu viele Anfragen. Bitte warte kurz." }, { status: 429 });
    }

    const { message, updateMessage } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Nachricht erforderlich" }, { status: 400 });
    }

    // Parse the main signal
    const combined = updateMessage
      ? `${message}\n\n--- UPDATE ---\n${updateMessage}`
      : message;

    const parsed = await parseSignal(combined);

    return NextResponse.json({
      success: true,
      parsed: {
        action: parsed.action,
        symbol: parsed.symbol,
        entryPrice: parsed.entryPrice,
        stopLoss: parsed.stopLoss,
        takeProfits: parsed.takeProfits,
        isModification: parsed.isModification,
        isClose: parsed.isClose,
        confidence: parsed.confidence,
        moveToBreakeven: parsed.moveToBreakeven,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Parse fehlgeschlagen" }, { status: 500 });
  }
}
