# GOLD FOUNDRY — WAS NOCH FEHLT
## Komplette Gap-Analyse + Lösungen

---

## 🔴 FEHLT: INDIVIDUELLE TRADER LANDING PAGES MIT PARTNER-ZUORDNUNG

### Das Problem:
Aktuell gibt es EINE Partner-LP. Aber ein Partner will nicht nur 
"Gold Foundry" verkaufen — er will SEINEN Trader empfehlen.

"Hey, schau dir VarnaTrader an — der macht +18% im Monat.
Hier mein Link: goldfoundry.de/r/max/varna-trader"

### Die Lösung: Jeder Trader + jede Strategie bekommt eine eigene LP

```
URL-Struktur:
  goldfoundry.de/trader/varna-trader              ← Öffentliche Trader-Seite
  goldfoundry.de/trader/varna-trader?ref=max       ← MIT Partner-Zuordnung
  goldfoundry.de/r/max/varna-trader                ← Kurzlink (gleiche Funktion)

Was auf der Seite steht:
┌──────────────────────────────────────────────────────┐
│ 🔥 VarnaTrader                                       │
│ XAUUSD Spezialist · London Session · Seit 2021       │
│                                                       │
│ ┌── EMPFOHLEN VON ──────────────────────────────┐    │
│ │ 👤 Max Müller · Gold Partner                   │    │
│ │ "Ich kopiere VarnaTrader seit 4 Monaten.       │    │
│ │  +18.4% Rendite. Bester Trader im Pool."       │    │
│ │ [📱 WhatsApp] [✈️ Telegram]                   │    │
│ └────────────────────────────────────────────────┘    │
│                                                       │
│ 📊 LIVE PERFORMANCE                                   │
│ ┌────────────────────────────────────────────────┐   │
│ │ 3 Monate: +18.4%  │  6 Monate: +31.2%        │   │
│ │ Win Rate: 72%      │  Profit Factor: 2.1      │   │
│ │ Max DD: 6.8%       │  Avg Trade: +1.4R        │   │
│ │ Trades/Woche: 12   │  Stil: Breakout + Trend  │   │
│ └────────────────────────────────────────────────┘   │
│                                                       │
│ 📈 EQUITY KURVE (Live Chart)                         │
│ ┌────────────────────────────────────────────────┐   │
│ │ [Chart: Aufwärtskurve der letzten 6 Monate]    │   │
│ │ Drawdown Phasen markiert, Recovery angezeigt    │   │
│ └────────────────────────────────────────────────┘   │
│                                                       │
│ 🎯 STRATEGIE                                         │
│ "VarnaTrader handelt XAUUSD während der London       │
│  Session. Fokus auf Order Block Breakouts mit         │
│  4-Split Take Profit und automatischem Break-Even."   │
│                                                       │
│ 🛡️ RISIKO-PROFIL                                     │
│ Risiko pro Trade: 1-2%                               │
│ Max Drawdown historisch: 6.8%                         │
│ Kill Switch: Aktiv bei 8%                             │
│ Session: London (08:00-12:00 UTC)                    │
│                                                       │
│ 💬 WAS ANDERE SAGEN                                  │
│ ⭐⭐⭐⭐⭐ "Bester Gold-Trader den ich kenne" — Anna S. │
│ ⭐⭐⭐⭐⭐ "Konsistent seit 5 Monaten" — Tom K.        │
│                                                       │
│ ┌────────────────────────────────────────────────┐   │
│ │  🚀 VarnaTrader jetzt kopieren — €6 im 1. Monat│   │
│ │  [JETZT STARTEN]                                │   │
│ │  Empfohlen von Max Müller                       │   │
│ └────────────────────────────────────────────────┘   │
│                                                       │
│ ⚠️ Risikohinweis: Vergangene Performance...          │
└──────────────────────────────────────────────────────┘
```

### Wie der Partner das nutzt:
```
Im Partner Dashboard → Tab "Meine Trader":

┌──────────────────────────────────────────────────────┐
│ 🎯 MEINE TRADER-LINKS                               │
│                                                       │
│ ┌─ VarnaTrader ──────────────────────────────────┐   │
│ │ 📊 +18.4% (3Mo) · Win Rate 72%                │   │
│ │ 🔗 goldfoundry.de/r/max/varna-trader           │   │
│ │ [📋 Link kopieren] [📱 WhatsApp] [QR Code]    │   │
│ │ Mein Kommentar: "Bester Gold-Trader im Pool"   │   │
│ │ [✏️ Kommentar bearbeiten]                      │   │
│ │ Stats: 47 Klicks · 8 Signups · 5 aktiv         │   │
│ └────────────────────────────────────────────────┘   │
│                                                       │
│ ┌─ GoldKing ─────────────────────────────────────┐   │
│ │ 📊 +12.7% (3Mo) · Win Rate 68%                │   │
│ │ 🔗 goldfoundry.de/r/max/gold-king              │   │
│ │ [📋 Link kopieren] [📱 WhatsApp] [QR Code]    │   │
│ │ Stats: 23 Klicks · 3 Signups · 2 aktiv         │   │
│ └────────────────────────────────────────────────┘   │
│                                                       │
│ ┌─ US500Sniper ──────────────────────────────────┐   │
│ │ 📊 +9.1% (3Mo) · Win Rate 65%                 │   │
│ │ 🔗 goldfoundry.de/r/max/us500-sniper           │   │
│ │ [📋 Link kopieren] [📱 WhatsApp] [QR Code]    │   │
│ │ Stats: 12 Klicks · 1 Signup · 1 aktiv          │   │
│ └────────────────────────────────────────────────┘   │
│                                                       │
│ [+ Trader zu meiner Liste hinzufügen]                │
└──────────────────────────────────────────────────────┘
```

### Technisch:
```
Route: src/app/trader/[slug]/page.tsx

URL Params:
  ?ref=max-mueller  → Setzt Cookie: ref_partner = max-mueller (90 Tage)
  
Oder Short-Link:
  /r/max/varna-trader → Redirect zu /trader/varna-trader?ref=max-mueller

Bei Signup: 
  Lese Cookie ref_partner → setze referred_by in profiles
  Lese Cookie ref_trader → setze selected_trader in user_data
  → User ist sofort dem Partner UND dem Trader zugeordnet
  → Copier startet automatisch mit dem empfohlenen Trader
```

---

## 🔴 FEHLT: STRATEGIE LANDING PAGES

Nicht nur pro Trader, sondern pro STRATEGIE:

```
goldfoundry.de/strategy/london-gold-breakout?ref=max
goldfoundry.de/strategy/safe-us500-swing?ref=max
goldfoundry.de/strategy/multi-asset-balanced?ref=max

Strategie-Seite zeigt:
- Welche Trader diese Strategie handeln
- Kombinierte Performance
- Risk-Profil
- "Empfohlen von Max Müller"
```

---

## 🔴 FEHLT: "EMPFOHLEN VON" AUF JEDER SEITE

Wenn jemand über einen Partner-Link reinkommt, zeigt JEDE Seite:

```
┌──────────────────────────────────────┐
│ 🤝 Empfohlen von Max Müller         │
│ Gold Partner · 347 Trader im Team    │
│ [💬 Kontakt aufnehmen]              │
└──────────────────────────────────────┘
```

Das ist ein kleiner Banner oben oder unten auf JEDER Seite.
Basierend auf dem ref-Cookie (90 Tage gültig).
Zeigt: Partner-Name, Rang, Netzwerk-Größe, Kontakt-Button.

Technisch: Globaler Layout-Check auf `cookies.ref_partner`.
Wenn gesetzt → Banner rendern mit Partner-Daten.

---

## 🔴 FEHLT: PARTNER ONBOARDING WIZARD

Neuer Partner meldet sich an → was passiert?

```
Schritt 1: "Willkommen im Partner Programm!"
  → Profil ausfüllen (Foto, Bio, Kontakt)
  
Schritt 2: "Wähle deine Trader"
  → Trader-Pool durchsuchen
  → Min. 1 Trader auswählen (für deine LP)
  
Schritt 3: "Deine Landing Page"
  → Vorschau der automatisch generierten LP
  → Slug wählen (goldfoundry.de/partner/dein-name)
  
Schritt 4: "Dein erster Referral"
  → WhatsApp Template kopieren
  → QR Code herunterladen
  → Oder: Builder Pack kaufen
  
Schritt 5: "Du bist ready!"
  → Dashboard Tour (3 Tooltips)
  → "Tipp: Teile deinen VarnaTrader-Link auf Instagram"
```

---

## 🔴 FEHLT: LINK TRACKING PRO KANAL

Partner brauchen separate Links pro Kanal um zu sehen WO ihre Signups herkommen:

```
goldfoundry.de/r/max/varna-trader?src=whatsapp
goldfoundry.de/r/max/varna-trader?src=instagram
goldfoundry.de/r/max/varna-trader?src=youtube
goldfoundry.de/r/max/varna-trader?src=telegram
goldfoundry.de/r/max/varna-trader?src=email

Im Dashboard:
  WhatsApp:  34 Klicks → 5 Signups (14.7%)
  Instagram: 89 Klicks → 3 Signups (3.4%)
  Telegram:  12 Klicks → 2 Signups (16.7%)
  YouTube:   156 Klicks → 7 Signups (4.5%)
  
→ "Dein bester Kanal ist Telegram (16.7% Conversion)"
→ "Fokussiere dich auf Telegram und WhatsApp"
```

---

## 🔴 FEHLT: PARTNER KYC (Know Your Customer)

Vor der ersten Auszahlung MUSS der Partner verifiziert sein:

```
KYC Level 1 (bis 5.000 FP/Auszahlung):
  - Email verifiziert ✅ (bei Signup)
  - Telefonnummer verifiziert
  - Vollständiger Name + Adresse
  
KYC Level 2 (bis 50.000 FP/Auszahlung):
  - Ausweiskopie (Personalausweis/Reisepass)
  - Adressnachweis (Rechnung/Kontoauszug)
  
KYC Level 3 (unbegrenzt):
  - Video-Ident (kurzes Video mit Ausweis)
  - Steuer-ID
```

---

## 🔴 FEHLT: DOWNLINE AKTIVITÄTS-NOTIFICATIONS

Leader wollen LIVE wissen was in ihrem Netzwerk passiert:

```
Push Notifications (im Dashboard + optional Email):
  🎉 "Anna S. hat sich über deinen Link angemeldet!" (sofort)
  🎉 "Tom K. hat seinen ersten Monat bezahlt!" (sofort)
  💰 "Fast Start Bonus: +150 FP für Toms Signup" (sofort)
  📈 "Dein L2 Partner Lisa hat 3 neue Refs diese Woche" (wöchentlich)
  ⚠️ "Jan P. ist seit 14 Tagen inaktiv" (bei Inaktivität)
  🏆 "Anna S. hat Silber-Rang erreicht!" (bei Rang-Change)
  💸 "Monatliche Provision gutgeschrieben: 4.040 FP" (monatlich)
  
Einstellbar: Welche Notifications will ich? Email? Push? Beides? Aus?
```

---

## 🔴 FEHLT: TEAM DUPLIKATION TOOLS

Der Leader muss seinen neuen Partnern SOFORT Material geben können:

```
"Starter Kit" Button:
  → Generiert eine Nachricht mit:
    - Link zur Gold Foundry Erklärung
    - Link zum Provisionsplan
    - 3 WhatsApp Vorlagen
    - Link zur Partner-Anmeldung (mit Ref-Code des Leaders)
    - Quick-Start Video
    
"Copy My Setup" Feature:
  → Neuer Partner kann die Trader-Auswahl des Leaders übernehmen
  → "Max empfiehlt: VarnaTrader + GoldKing"
  → 1 Klick → gleiche Trader auf der eigenen LP
```

---

## 🔴 FEHLT: PROVISIONS-RECHNER (Interaktiv auf LP)

```
┌──────────────────────────────────────────────────────┐
│ 💰 WAS KANNST DU VERDIENEN?                          │
│                                                       │
│ Wie viele Partner wirbst du direkt?                   │
│ [──────────●─────────────] 15                        │
│                                                       │
│ Durchschnittlicher Plan deiner Refs:                  │
│ [Copier €29 ▼]                                       │
│                                                       │
│ ┌────────────────────────────────────────────────┐   │
│ │ DEIN RANG: 🥇 GOLD                            │   │
│ │                                                │   │
│ │ Monatliches Einkommen (geschätzt):             │   │
│ │                                                │   │
│ │ Unilevel:    2.340 FP (€234)                  │   │
│ │ Performance:   680 FP (€68)                    │   │
│ │ Matching:      420 FP (€42)                    │   │
│ │ Rang-Bonus:  1.000 FP (€100)                  │   │
│ │ ────────────────────────                       │   │
│ │ TOTAL:       4.440 FP (€444/Mo)               │   │
│ │                                                │   │
│ │ 📈 In 12 Monaten: ~€5.328                     │   │
│ │ 📈 In 24 Monaten: ~€14.200 (Netzwerk wächst)  │   │
│ └────────────────────────────────────────────────┘   │
│                                                       │
│ ⚠️ Berechnung basiert auf 15% Aktivitätsrate         │
│    und durchschnittlichem Netzwerk-Wachstum.          │
│    Tatsächliche Ergebnisse können abweichen.           │
└──────────────────────────────────────────────────────┘
```

---

## 🔴 FEHLT: MULTI-LANGUAGE PARTNER PAGES

Partner in verschiedenen Ländern brauchen LPs in ihrer Sprache:

```
goldfoundry.de/partner/max-mueller           → Deutsch
goldfoundry.de/en/partner/max-mueller         → English
goldfoundry.de/tr/partner/max-mueller         → Türkisch
goldfoundry.de/ar/partner/max-mueller         → Arabisch

Automatisch erkannt via Browser-Sprache.
Partner kann im Dashboard wählen welche Sprachen aktiv sein sollen.
```

---

## 🔴 FEHLT: STEUER-TOOLS FÜR PARTNER

```
Partner Dashboard → Steuer-Export:
  [📥 Monatsabrechnung März 2026 (PDF)]
  [📥 Jahresübersicht 2025 (PDF)]
  [📥 Alle Transaktionen (CSV)]
  
PDF enthält:
  - Name + Adresse des Partners
  - FORGE Points Gutschriften (nach Typ)
  - Auszahlungen (Datum, Betrag, Methode, TX Hash)
  - Umrechnung FP → EUR
  - Hinweis: "Dies ist keine Steuerberatung"
```

---

## 📦 UPDATED CLAUDE CODE INFRASTRUCTURE

### Erweiterte Datei-Struktur:
```
src/app/trader/
  └── [slug]/page.tsx              ← NEUE Trader LP (mit ?ref= Support)

src/app/strategy/
  └── [slug]/page.tsx              ← NEUE Strategie LP

src/app/partner/
  ├── [slug]/page.tsx              ← Partner-LP (schon geplant)
  └── onboarding/page.tsx          ← NEU: Partner Onboarding Wizard

src/lib/mlm/
  ├── network-engine.ts
  ├── commission-engine.ts
  ├── matching-engine.ts
  ├── rank-engine.ts
  ├── builder-packs.ts
  ├── payout-engine.ts
  ├── referral-tracking.ts         ← NEU: Link Tracking + Source Attribution
  └── kyc-engine.ts                ← NEU: KYC Verification Levels

src/lib/notifications/
  └── partner-notifications.ts     ← NEU: Downline Activity Notifications

src/components/
  ├── recommended-by-banner.tsx    ← NEU: "Empfohlen von" Banner (global)
  ├── income-calculator.tsx        ← NEU: Interaktiver Provisions-Rechner
  └── trader-card.tsx              ← NEU: Trader-Karte (wiederverwendbar)
```

### Neue Datenbank-Tabellen:
```sql
-- Referral Tracking mit Kanal
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES profiles(id),
  trader_slug TEXT,
  source TEXT,                     -- 'whatsapp', 'instagram', 'telegram', etc.
  ip_hash TEXT,                    -- Gehashte IP (Privacy)
  converted BOOLEAN DEFAULT false,
  converted_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Landing Page Config
CREATE TABLE IF NOT EXISTS partner_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  headline TEXT,
  bio TEXT,
  photo_url TEXT,
  video_url TEXT,
  selected_traders TEXT[],        -- Array von Trader Slugs
  trader_comments JSONB,          -- {"varna-trader": "Mein Lieblingstrader"}
  contact_whatsapp TEXT,
  contact_telegram TEXT,
  contact_email TEXT,
  languages TEXT[] DEFAULT '{"de"}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- KYC
CREATE TABLE IF NOT EXISTS partner_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  level INTEGER DEFAULT 0,        -- 0=none, 1=basic, 2=verified, 3=full
  full_name TEXT,
  address JSONB,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  id_document_url TEXT,            -- Encrypted
  address_proof_url TEXT,          -- Encrypted
  video_ident_url TEXT,            -- Encrypted
  tax_id TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS partner_notification_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  new_signup BOOLEAN DEFAULT true,
  first_payment BOOLEAN DEFAULT true,
  fast_start BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  inactivity_alert BOOLEAN DEFAULT true,
  rank_change BOOLEAN DEFAULT true,
  monthly_commission BOOLEAN DEFAULT true,
  channel TEXT DEFAULT 'both'      -- 'email', 'push', 'both', 'none'
);

CREATE INDEX idx_referral_clicks_partner ON referral_clicks(partner_id, created_at DESC);
CREATE INDEX idx_referral_clicks_source ON referral_clicks(partner_id, source);
CREATE INDEX idx_partner_pages_slug ON partner_pages(slug);
```

### Erweiterter Skill: mlm-network
```
Neue Sektion im SKILL.md:

## Trader Landing Pages
Route: /trader/[slug] — Öffentliche Trader-Seite
Query Param: ?ref=partner-slug — Setzt 90-Tage Cookie
Short-Link: /r/[partner]/[trader] → Redirect mit Cookie
"Empfohlen von" Banner: Globaler Check auf ref_partner Cookie.

## Link Tracking
Jeder Klick wird in referral_clicks gespeichert.
Source via ?src= Parameter (whatsapp, instagram, etc.)
Partner sieht Breakdown pro Kanal im Dashboard.

## KYC
3 Level. Level 1 für kleine Auszahlungen.
Level 2 mit Ausweiskopie für bis 50K FP.
Level 3 mit Video-Ident für unbegrenzt.

## Partner Onboarding
5-Schritt Wizard nach erstem Login als Partner.
```
