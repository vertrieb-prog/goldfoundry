# GOLD FOUNDRY — VON 70% AUF 95% AUTONOMIE
## Jede fehlende Automatisierung + Lösung

---

## WAS 95% AUTONOMIE BEDEUTET

"Du musst nur noch 2 Sachen manuell machen:
1. Neue Trader freischalten (Qualitätskontrolle)
2. Geld auszahlen (Sicherheitsgründe)
ALLES andere macht das System alleine."

---

## DIE 10 FEHLENDEN AUTOMATISIERUNGEN

### ❌→✅ 1. AUTO-ONBOARDING (aktuell: User ist lost nach Signup)

**Problem:** User registriert sich → sieht leeres Dashboard → weiß nicht was tun → churnt.
**Lösung:** Trigger-basierte Onboarding-Kette:

```
TRIGGER: User erstellt Account (Supabase Auth Webhook)
→ Schritt 1: Welcome Email mit 5-Schritte Guide (sofort)
→ Schritt 2: Dashboard zeigt Onboarding-Wizard (UI-State: onboarding=true)
→ Schritt 3: User wählt Broker → System zeigt Tutorial-Video
→ Schritt 4: User verbindet MetaApi → System prüft Connection
→ Schritt 5: User wählt Trader → Copier startet automatisch
→ Schritt 6: Onboarding-Status auf "complete" → normales Dashboard
```

**Umsetzung:**
- Supabase Database Webhook: `profiles.INSERT` → ruft `/api/webhooks/new-user` auf
- API Route erstellt Welcome-Email + setzt `onboarding_step: 1`
- Dashboard liest `onboarding_step` und zeigt passenden Wizard-Schritt
- Jeder Schritt-Abschluss → `UPDATE profiles SET onboarding_step = N+1`

### ❌→✅ 2. AUTO-LOT-SCALING (aktuell: Lots ändern sich nicht bei Balance-Änderung)

**Problem:** User stockt Konto auf von $10K auf $50K → Lots bleiben bei $10K-Level.
**Lösung:** Equity Snapshot Cron (läuft schon jede Stunde!) erweitern:

```
TRIGGER: Equity Snapshot erkennt Balance-Änderung > 10%
→ Neu-Berechnung: Lot-Größe basierend auf neuer Balance
→ Update in Supabase: user_data.risk_settings.lots
→ Nächster Trade nutzt automatisch neue Lots
→ Optional: Notification an User "Lots angepasst auf 0.15 (vorher 0.05)"
```

**Umsetzung:** 3 Zeilen im bestehenden equity-snapshot Cron hinzufügen.

### ❌→✅ 3. AUTO-PARTNER-TIER-UPGRADE (aktuell: bleibt manuell auf Bronze)

**Problem:** Partner erreicht 5 Referrals → Tier bleibt auf Bronze statt Silver.
**Lösung:** Täglicher Cron:

```
TRIGGER: Cron 23:30 UTC (täglich)
→ Für jeden Partner: Zähle aktive Referrals
→ Wenn Referrals >= Tier-Schwelle → Upgrade
→ Wenn Referrals < aktuellem Tier → Downgrade (mit 30-Tage Grace Period)
→ Bei Upgrade: Congratulations-Email + neue Provisions-Rate
→ Bei fast-Upgrade: "Du brauchst noch 2 Partner für Gold!" Email
```

**Umsetzung:** Neuer Sub-Cron `/api/cron/partner-tiers`. ~30 Zeilen.

### ❌→✅ 4. AUTO-PAYOUT-BERECHNUNG (aktuell: keine automatische Abrechnung)

**Problem:** Provisionen werden nirgends automatisch berechnet.
**Lösung:** Monatlicher Cron am 1. des Monats:

```
TRIGGER: Cron am 1. jeden Monats, 02:00 UTC
→ Für jeden Partner: Berechne Provision des Vormonats
→ L1: Direkte Referrals × Plan-Preis × Tier-Rate
→ L2: Referrals der Referrals × Preis × L2-Rate
→ L3: Dritte Ebene × Preis × L3-Rate
→ Erstelle Eintrag in affiliate_payouts (status: pending)
→ Email an Partner: "Deine Provision für März: €127.50"
→ Email an Admin: "5 Payouts pending, Gesamt €892.30"
```

**Auszahlung bleibt manuell** (Sicherheit) — aber Berechnung ist autonom.

### ❌→✅ 5. AUTO-METAAPI-HEALTH-CHECK (aktuell: kein Alert bei Disconnect)

**Problem:** MetaApi Verbindung stirbt → Trades werden nicht kopiert → User merkt es nicht.
**Lösung:** Health-Check alle 15 Minuten:

```
TRIGGER: Cron alle 15 Min (im Master Cron: if (minute % 15 === 0))
→ Für jeden aktiven Account: MetaApi Connection Check
→ Wenn disconnected:
   1. Automatisch Reconnect versuchen (3 Versuche)
   2. Wenn erfolgreich → Log + weiter
   3. Wenn fehlgeschlagen → Alert an User ("Dein Konto ist offline")
   4. Alert an Admin Dashboard
   5. CRM Activity: "metaapi_disconnect"
   6. Copier pausieren (Safety: keine Trades ohne Connection)
```

**Umsetzung:** Neuer Sub-Cron `/api/cron/health-check`. ~40 Zeilen.

### ❌→✅ 6. AUTO-CHANNEL-SCAN (aktuell: keine automatische Channel-Bewertung)

**Problem:** User verbindet Telegram Channel → Channel wird nie auf Qualität geprüft.
**Lösung:** Wöchentlicher Scan:

```
TRIGGER: Cron Sonntag 03:00 UTC
→ Für jeden verbundenen Channel:
   1. Letzte 50 Signale aus telegram_signals laden
   2. Win Rate berechnen (30d/60d/90d)
   3. Fake Detection (editierte/gelöschte Signale)
   4. R:R Analyse
   5. Signal-Frequenz Check
   6. Score berechnen (0-100)
→ Wenn Score < 30: Channel automatisch pausieren + User warnen
→ Wenn Score > 70: Badge "Verified Channel"
→ Update telegram_channels.scan_score
```

### ❌→✅ 7. AUTO-CHURN-INTERVENTION (aktuell: nur Email bei Inaktivität)

**Problem:** Win-Back Emails reichen nicht. User churnt trotzdem.
**Lösung:** Intelligente Multi-Channel Intervention:

```
TRIGGER: CRM Lead Score sinkt unter 30 (täglicher Cron)
→ Tag 1: Win-Back Email ("Du fehlst uns")
→ Tag 3: Push Notification (PWA) ("Dein Trader hat +4.2% diese Woche")
→ Tag 7: Persönliche Email vom "Team" mit Performance-Daten
→ Tag 14: Angebot: "50% Rabatt für 3 Monate wenn du jetzt zurückkommst"
→ Tag 30: Letzte Email: "Dein Account wird in 30 Tagen archiviert"
→ Tag 60: Account archivieren (Daten behalten, Copier stoppen)
```

### ❌→✅ 8. AUTO-CONTENT-QUALITÄT (aktuell: SEO Content ungeprüft)

**Problem:** SEO Engine generiert Seiten aber prüft nicht ob sie gut sind.
**Lösung:** Quality Gate nach Generierung:

```
TRIGGER: Nach jeder SEO-Seiten-Generierung
→ Check 1: Mindestens 500 Wörter? (kein Thin Content)
→ Check 2: Einzigartig? (nicht 90% gleich wie andere Seite)
→ Check 3: Risikohinweis vorhanden?
→ Check 4: Keine Profit-Versprechen?
→ Check 5: Auto-Links eingefügt?
→ Wenn alle Checks OK → publish (status: "live")
→ Wenn nicht → status: "draft" + Admin Alert
```

### ❌→✅ 9. AUTO-PERFORMANCE-REPORT (aktuell: kein automatischer User-Report)

**Problem:** User weiß nicht wie sein Account performt (außer er schaut ins Dashboard).
**Lösung:** Wöchentlicher + Monatlicher Report per Email:

```
TRIGGER: Cron Montag 08:00 UTC (wöchentlich) + 1. des Monats
→ Für jeden aktiven User:
   1. Performance: Win Rate, P&L, Max DD diese Woche/Monat
   2. Vergleich: Besser/schlechter als letzter Zeitraum
   3. Top Trade + Worst Trade
   4. Risk Status: DD-Buffer, Lot-Nutzung
   5. Empfehlung von Intelligence Engine
→ Email senden via Resend
→ CRM Activity: "performance_report_sent"
```

### ❌→✅ 10. AUTO-SCALING-ALERT (aktuell: kein Alert bei Systemlast)

**Problem:** Wenn 100+ User gleichzeitig traden, könnte MetaApi überlasten.
**Lösung:** System Monitoring:

```
TRIGGER: Cron alle 5 Min (oder im Master Cron)
→ Check: MetaApi Active Connections
→ Check: Supabase Query Performance
→ Check: Vercel Function Duration
→ Check: Anthropic API Kosten heute
→ Wenn Anomalie → Admin Alert
→ Dashboard Widget: System Health (grün/gelb/rot)
```

---

## NEUER CRON SCHEDULE (70% → 95%)

```
BESTEHEND:
  Jede Stunde  → Master Cron Orchestrator
  04:00        → MQL5 Collector
  05:00        → MyFxBook Collector
  06:00        → Intelligence Engine
  06:30        → Daily News SEO
  08:00        → Blog (Mo/Mi/Fr)
  10:00        → Win-Back Emails
  13:00        → Midday News
  23:00        → Sitemap Regen
  Alle 4h      → Sentiment Snapshot
  Jede Stunde  → Equity Snapshot (wenn Markets offen)
  Live         → Telegram Listener
  Trigger      → Trade Manager

NEU HINZUFÜGEN:
  Alle 15 Min  → MetaApi Health Check (NEU)
  Alle 5 Min   → System Monitoring (NEU)
  Täglich 23:30→ Partner Tier Berechnung (NEU)
  Monatlich 1. → Payout Berechnung (NEU)
  Montag 08:00 → Wöchentlicher Performance Report (NEU)
  Monatlich 1. → Monatlicher Performance Report (NEU)
  Sonntag 03:00→ Channel Scan (NEU)
  Täglich 22:00→ Churn Intervention Check (NEU)
  Nach SEO Gen → Content Quality Gate (NEU, kein Cron sondern Trigger)
  Bei Signup   → Auto-Onboarding Kette (NEU, Webhook-Trigger)
  Bei Balance  → Auto-Lot-Scaling (NEU, im Equity Snapshot)
```

Alles läuft über den EINEN Master Cron. Kein neuer Vercel Cron nötig.
Master Cron prüft: Stunde + Minute + Tag + Datum → dispatcht den richtigen Job.

---

## AUTONOMIE-LEVEL NACH UMSETZUNG

```
VORHER (70%):
  ✅ Daten sammeln          ✅ Intelligence analysieren
  ✅ Trades kopieren        ✅ Risk managen
  ✅ Kill Switch            ✅ SEO generieren
  ✅ Emails (Welcome)       ✅ Payment Processing
  ❌ Onboarding             ❌ Lot Scaling
  ❌ Partner Tiers          ❌ Payouts
  ❌ Health Check           ❌ Channel Scan
  ❌ Churn Intervention     ❌ Content Quality
  ❌ Performance Reports    ❌ System Monitoring

NACHHER (95%):
  ✅ Daten sammeln          ✅ Intelligence analysieren
  ✅ Trades kopieren        ✅ Risk managen
  ✅ Kill Switch            ✅ SEO generieren
  ✅ Emails (Welcome+Report)✅ Payment Processing
  ✅ Onboarding (Wizard)    ✅ Lot Scaling (auto)
  ✅ Partner Tiers (auto)   ✅ Payouts (berechnet)
  ✅ Health Check (15 Min)  ✅ Channel Scan (wöchentlich)
  ✅ Churn Intervention     ✅ Content Quality Gate
  ✅ Performance Reports    ✅ System Monitoring

VERBLEIBENDE 5% (bewusst manuell):
  🔒 Payout-Freigabe (Sicherheit — Admin muss bestätigen)
  🔒 Neue Trader freischalten (Qualitätskontrolle — Admin prüft)
  🔒 Neue Broker hinzufügen (Konfiguration — einmalig)
  🔒 Preisänderungen (Strategie-Entscheidung)
  🔒 Feature-Entwicklung (das machen wir hier)
```

---

## UMSETZUNGS-AUFWAND

| Automatisierung | Aufwand | Abhängigkeit |
|----------------|---------|--------------|
| Auto-Onboarding | 2-3h | Dashboard muss stehen |
| Auto-Lot-Scaling | 15 Min | Equity Snapshot erweitern |
| Auto-Partner-Tiers | 30 Min | Neuer Sub-Cron |
| Auto-Payout-Berechnung | 1h | Neuer Sub-Cron |
| MetaApi Health Check | 45 Min | Neuer Sub-Cron |
| Auto-Channel-Scan | 1h | Channel Scanner existiert |
| Churn Intervention | 1h | CRM + Email Engine existieren |
| Content Quality Gate | 30 Min | Im SEO Engine Cron |
| Performance Reports | 1h | Email Engine + Supabase Queries |
| System Monitoring | 45 Min | Neuer Sub-Cron |
| **TOTAL** | **~10h** | Meiste Infrastruktur existiert |

Mit Claude Code Agent Teams: ~3-4h realistisch (parallel!).
