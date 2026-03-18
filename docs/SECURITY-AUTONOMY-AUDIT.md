# GOLD FOUNDRY — SECURITY AUDIT + AUTONOMIE-STATUS
## Letzte Prüfung vor Go-Live

---

## 🔴 SICHERHEITSLÜCKEN (MUSS vor Live gefixt werden)

### KRITISCH 1: Kein Rate Limiting
Jemand kann /api/chat 10.000× pro Sekunde aufrufen und deine
Anthropic-Rechnung explodieren lassen. Oder DDoS auf jede API Route.
→ FIX: @upstash/ratelimit installieren. Kostenloser Tier reicht.
```typescript
// In jeder API Route:
import { Ratelimit } from "@upstash/ratelimit";
const ratelimit = new Ratelimit({ redis: Redis, limiter: Ratelimit.slidingWindow(10, "60 s") });
const { success } = await ratelimit.limit(ip);
if (!success) return Response.json({ error: "Too many requests" }, { status: 429 });
```

### KRITISCH 2: Kein Error Monitoring
Wenn was crasht weißt du es NICHT. User sehen Fehler, du siehst nichts.
→ FIX: Sentry installieren (kostenlos bis 5K Events/Mo).
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### KRITISCH 3: XSS in Chrome Extension
Die Extension nutzt innerHTML mit dynamischem Content.
Ein bösartiger Telegram-Signal-Text könnte JavaScript injizieren.
→ FIX: textContent statt innerHTML. Oder DOMPurify nutzen.

### HOCH 4: MyFxBook Passwort in URL
Der Data Collector schickt Email + Passwort als URL-Parameter.
Das landet in Server-Logs und ist im Klartext sichtbar.
→ FIX: POST Request statt GET. Oder besser: MyFxBook API Token nutzen.

### HOCH 5: Supabase Service Key Exposure-Risiko
SUPABASE_SERVICE_KEY hat VOLLEN Zugriff auf die Datenbank (bypassed RLS).
Wenn der Key leakt → ALLES ist kompromittiert.
→ FIX:
  - Key NUR in Backend/API Routes verwenden (check ✅ — machen wir schon)
  - NIEMALS in NEXT_PUBLIC_ Variablen
  - Auf Vercel: Key nur für "Production" Environment, NICHT für "Preview"
  - Row Level Security (RLS) auf ALLEN User-Tabellen aktivieren

### HOCH 6: Keine CSRF Protection auf Webhooks
Stripe Webhook prüft Signatur ✅ (sieht gut aus).
Cryptomus Webhook prüft "sign" Header ✅.
ABER: Die Cron Routes prüfen nur CRON_SECRET.
→ FIX: Zusätzlich IP-Whitelist für Vercel Cron IPs.

### MITTEL 7: Keine Input Validation
API Routes prüfen nicht ob der Input valide ist.
Jemand könnte riesige Payloads senden.
→ FIX: Zod Validation auf jeder API Route:
```typescript
import { z } from "zod";
const schema = z.object({ message: z.string().max(2000) });
const parsed = schema.safeParse(await req.json());
if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
```

### MITTEL 8: Keine Content Security Policy
Kein CSP Header = XSS-Risiko auf der Website.
→ FIX: In next.config.js Security Headers hinzufügen:
```js
headers: [{ source: "/(.*)", headers: [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
]}]
```

### NIEDRIG 9: package-lock.json nicht geprüft
Bekannte Vulnerabilities in Dependencies?
→ FIX: `npm audit` ausführen und kritische Vulnerabilities fixen.

---

## 🤖 AUTONOMIE-STATUS: Was läuft von alleine?

### ✅ WAS SCHON AUTONOM IST (nach Integration):

**Master Cron (jede Stunde):**
```
04:00 UTC → MQL5 Daten sammeln
05:00 UTC → MyFxBook Daten sammeln
06:00 UTC → Intelligence Engine (analysiert ALLE Daten)
06:30 UTC → SEO: Daily News generieren
08:00 UTC → Blog Artikel (Mo/Mi/Fr)
10:00 UTC → Win-Back Emails an inaktive User
13:00 UTC → Midday News (Wochentags)
23:00 UTC → Sitemap regenerieren
Alle 4h  → Sentiment Snapshot
Jede Std → Equity Snapshot (wenn Markets offen)
```
→ Das läuft KOMPLETT von alleine. Kein Mensch nötig.

**Telegram Listener (24/7):**
- Hört Telegram Channels ab
- Parst Signale automatisch (Haiku, 35ms)
- Prüft Risk Engine (DD, Lot, Session, News)
- Führt Trade aus via MetaApi
- Sendet Confirmation an User
→ Von Signal bis Trade: ~2 Sekunden, komplett autonom.

**Trade Manager (trigger-basiert):**
- Überwacht offene Positions
- Bei R-Milestone (1R, 2R, 3R) → AI entscheidet: HOLD/TIGHTEN/PARTIAL
- Bei DD-Gefahr → Automatisch Lots reduzieren
- Bei Kill-Switch Trigger → ALLE Trades sofort schließen
→ Reagiert autonom auf Marktbewegungen.

**Stripe/Cryptomus Webhooks:**
- User zahlt → Webhook → Account wird aktiviert → Welcome Email
→ Payment-to-Active komplett autonom.

**CRM Email-Sequenzen:**
- Tag 0: Welcome Email
- Tag 1: Setup Guide
- Tag 3: "Erste Trades?" Check-in
- Tag 7: Feature Highlight
- Tag 14: Performance Report
- Tag 30: Upgrade Angebot
→ Läuft automatisch nach Signup.

**SEO Engine:**
- Generiert automatisch 3 News/Tag, 3 Blog/Woche
- Auto-Linker verknüpft Seiten untereinander
- Sitemap wird täglich regeneriert
→ Content-Maschine läuft autonom.

### ❌ WAS NOCH NICHT AUTONOM IST:

**1. Kein Auto-Scaling der Lot-Größen**
Wenn ein User sein Konto aufstockt (z.B. von $10K auf $50K),
passt sich die Lot-Größe NICHT automatisch an.
→ BRAUCHT: Account Balance Watcher der bei Änderung Lots neu berechnet.

**2. Kein Auto-Onboarding**
User registriert sich → muss SELBST wissen was er tun soll.
→ BRAUCHT: Onboarding Wizard (5 Schritte, automatisch)

**3. Kein Auto-Partner-Tier-Upgrade**
Wenn ein Partner 5 Referrals erreicht → bleibt er manuell auf Bronze.
→ BRAUCHT: Cron der Partner-Tiers automatisch berechnet.

**4. Kein Auto-Payout**
Affiliate-Provisionen werden berechnet aber nicht automatisch ausgezahlt.
→ BRAUCHT: Monatlicher Payout-Cron (oder manueller Trigger im Admin Panel).

**5. Kein Auto-Recovery nach MetaApi-Disconnect**
Wenn MetaApi die Verbindung verliert → Trades werden nicht mehr kopiert.
Kein Alert an den User oder Admin.
→ BRAUCHT: Health-Check Cron + Alert-System.

**6. Kein Auto-Channel-Scan**
Telegram Channels werden NICHT automatisch bewertet.
User muss manuell sagen welchen Channel er kopieren will.
→ BRAUCHT: Cron der alle verbundenen Channels wöchentlich scannt.

---

## 📋 GO-LIVE CHECKLISTE

### MUSS (ohne geht nichts live):
```
□ npm run build funktioniert
□ Vercel Deployment geht durch
□ Alle ENV Vars auf Vercel gesetzt
□ Supabase Tabellen existieren (alle 5 Migrations)
□ RLS Policies auf User-Tabellen aktiv
□ Homepage + Pricing + Auth funktionieren
□ Rate Limiting auf /api/chat und /api/copier
□ CRON_SECRET ist gesetzt und sicher
□ Stripe Webhook verifiziert Signatur
□ Risikohinweis auf JEDER öffentlichen Seite
□ Kein "AI"/"GRATIS"/"$" in Customer-Facing Code
□ Error Monitoring (Sentry) installiert
□ Security Headers in next.config.js
```

### SOLLTE (erste Woche nach Launch):
```
□ Input Validation (Zod) auf allen API Routes
□ npm audit fix
□ MetaApi Health Check Cron
□ Partner-Tier Auto-Upgrade Cron
□ Chrome Extension innerHTML → textContent fix
□ MyFxBook Login von GET auf POST umstellen
□ Auto-Payout oder manueller Trigger im Admin
□ Onboarding Wizard (mindestens Basic-Version)
```

### NICE-TO-HAVE (Monat 1):
```
□ Content Security Policy Headers
□ Auto-Channel-Scan Cron
□ Performance Dashboard (public)
□ Telegram Bot
□ Paper Trading Demo
```
