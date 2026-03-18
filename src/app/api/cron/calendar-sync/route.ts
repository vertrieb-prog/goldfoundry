export const dynamic = "force-dynamic";
// src/app/api/cron/calendar-sync/route.ts
// Importiert Economic Calendar Events → economic_calendar DB-Tabelle
// Sollte alle 4 Stunden laufen (oder vor Market Open)

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { classifyEventTier } from "@/lib/intel/market-intel";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Forex Factory API (kostenlos, kein API-Key nötig)
    const resp = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GoldFoundry/1.0)" },
    });

    if (!resp.ok) {
      return NextResponse.json({ error: `Calendar API returned ${resp.status}` }, { status: 502 });
    }

    const events = await resp.json();
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid calendar data" }, { status: 502 });
    }

    const db = createSupabaseAdmin();
    const now = new Date();
    let imported = 0;
    let skipped = 0;

    // Nur Events ab jetzt minus 2h (um aktuelle Events nicht zu verpassen)
    const cutoff = new Date(now.getTime() - 2 * 3600000);

    for (const event of events) {
      if (!event.date || !event.title) continue;

      const eventTime = new Date(event.date);
      if (eventTime < cutoff) { skipped++; continue; }

      const tier = classifyEventTier(event.title);
      const impact = event.impact === "High" ? "high" : event.impact === "Medium" ? "medium" : "low";

      // Upsert basierend auf event_time + title (vermeidet Duplikate)
      const { error } = await db.from("economic_calendar").upsert({
        event_time: eventTime.toISOString(),
        title: event.title,
        country: event.country || null,
        impact,
        tier,
        forecast: event.forecast || null,
        previous: event.previous || null,
        actual: event.actual || null,
        updated_at: now.toISOString(),
      }, {
        onConflict: "event_time,title",
        ignoreDuplicates: true,
      });

      if (!error) imported++;
      else skipped++;
    }

    console.log(`[CALENDAR-SYNC] ${imported} Events importiert, ${skipped} übersprungen`);
    return NextResponse.json({ success: true, imported, skipped, total: events.length });
  } catch (err) {
    console.error("[CALENDAR-SYNC] Error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
