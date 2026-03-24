export const dynamic = "force-dynamic";
// POST /api/telegram/parse-preview — Live-Preview: Signal parsen ohne auszuführen
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { parseSignal } from "@/lib/telegram-copier/parser";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

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
