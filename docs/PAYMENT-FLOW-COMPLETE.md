# GOLD FOUNDRY — KOMPLETTER GELDFLUSS
## Von der Zahlung bis zur Provision — vollautomatisch

---

## 💳 SCHRITT 1: USER ZAHLT

### Flow:
```
User klickt "Jetzt starten" auf Pricing-Seite
    ↓
Wählt Zahlungsmethode:
  → Karte (Stripe)     → stripe.com/checkout
  → Crypto (Cryptomus) → pay.cryptomus.com
    ↓
Zahlung erfolgreich
    ↓
Webhook kommt zu unserem Server:
  POST /api/stripe/webhook (oder /api/cryptomus/webhook)
    ↓
Server prüft:
  1. Signatur gültig? (Stripe: constructEvent, Cryptomus: sign Header)
  2. Welcher User? (customer_email oder metadata.user_id)
  3. Welcher Plan? (metadata.plan = "copier" | "starter" | "pro" | "unlimited")
    ↓
Server aktiviert:
  1. UPDATE profiles SET plan = 'copier', plan_active = true, plan_started_at = now()
  2. Wenn erster Monat: Rabatt-Preis (€6 statt €29)
  3. CRM: Lead Score +30, Status → "active"
  4. Email: Welcome + Setup Guide senden
  5. Copier: Wenn schon verbunden → automatisch starten
```

### Was wir haben: ✅ Stripe Checkout + Webhook existieren
### Was fehlt: 
- ⬜ Cryptomus Webhook muss an gleiche Logik angebunden werden
- ⬜ Automatisches Copier-Starten nach Zahlung
- ⬜ CRM Lead Score Update bei Zahlung
- ⬜ 1. Monat Rabatt-Logik (80% Rabatt Preis)

---

## 📊 SCHRITT 2: MONATLICHE ABRECHNUNG (Subscription)

### Flow:
```
Stripe Subscription (automatisch jeden Monat):
    ↓
Stripe versucht Karte zu belasten
    ↓
  ERFOLG:
    → Webhook: invoice.paid
    → Server: Plan verlängern, plan_expires_at += 30 Tage
    → CRM Activity: "subscription_renewed"
    → Weiter traden
    
  FEHLGESCHLAGEN:
    → Webhook: invoice.payment_failed
    → Server: Grace Period starten (3 Tage)
    → Email: "Deine Zahlung ist fehlgeschlagen. Bitte aktualisiere deine Karte."
    → Tag 1: Reminder Email
    → Tag 3: Copier PAUSIERT (Trades werden nicht mehr kopiert)
    → Tag 7: Account auf "paused" setzen
    → Tag 30: Account auf "churned" setzen
    → CRM: Churn Intervention Kette startet
```

### Was wir haben: ✅ Stripe Webhook für invoice.paid
### Was fehlt:
- ⬜ invoice.payment_failed Handling
- ⬜ Grace Period Logik
- ⬜ Automatisches Copier-Pausieren bei unbezahlter Rechnung
- ⬜ Dunning Emails (Zahlungserinnerungen)

---

## 💰 SCHRITT 3: PROVISIONEN BERECHNEN (automatisch)

### Wann:
Am 1. jeden Monats, 02:00 UTC (Cron Job)

### Flow:
```
Cron: /api/cron/calculate-commissions
    ↓
Für JEDEN Partner (profiles WHERE plan = 'partner' AND plan_active = true):
    ↓
  1. Lade alle DIREKTE Referrals (Level 1):
     SELECT * FROM profiles WHERE referred_by = partner.id AND plan_active = true
    ↓
  2. Berechne L1 Provision:
     Für jeden aktiven Referral:
       Referral Plan-Preis × Partner Tier Rate
       
     Beispiel: Partner ist SILBER (35%)
       Referral 1: Signal Pro €79 × 35% = €27.65
       Referral 2: Copier €29 × 35% = €10.15
       Referral 3: Copier €29 × 35% = €10.15
       L1 Total: €47.95
    ↓
  3. Berechne L2 Provision (Referrals der Referrals):
     Nur wenn Partner Tier >= Silber
     SELECT * FROM profiles WHERE referred_by IN (L1 Referral IDs) AND plan_active = true
     
     Beispiel: Silber = L2 10%
       Sub-Referral 1: Copier €29 × 10% = €2.90
       L2 Total: €2.90
    ↓
  4. Berechne L3 Provision (3. Ebene):
     Nur wenn Partner Tier >= Gold
     Beispiel: Gold = L3 5%
       L3 Total: €0
    ↓
  5. TOTAL Provision diesen Monat:
     €47.95 + €2.90 + €0 = €50.85
    ↓
  6. Erstelle Payout-Eintrag:
     INSERT INTO affiliate_payouts (
       partner_id, period, l1_amount, l2_amount, l3_amount,
       total_amount, status, created_at
     ) VALUES (
       partner.id, '2026-03', 47.95, 2.90, 0,
       50.85, 'pending', now()
     )
    ↓
  7. Email an Partner:
     "Deine Provision für März 2026: €50.85
      L1: €47.95 (3 aktive Referrals × 35%)
      L2: €2.90 (1 Sub-Referral × 10%)
      Auszahlung: Wird in den nächsten 5 Werktagen bearbeitet."
    ↓
  8. Email an Admin:
     "12 Payouts pending, Gesamt €892.30
      → Prüfen und freigeben im Admin Panel"
```

### Provision-Tabelle:
```
TIER       | MIN REFS | L1    | L2    | L3
-----------+----------+-------+-------+------
Bronze     | 1        | 30%   | —     | —
Silber     | 5        | 35%   | 10%   | —
Gold       | 15       | 40%   | 12%   | 5%
Diamond    | 50       | 50%   | 15%   | 8%
```

### Was wir haben: ✅ Affiliate Engine berechnet Tiers
### Was fehlt:
- ⬜ Monatlicher Cron für Commission Calculation
- ⬜ Multi-Level Berechnung (L1 + L2 + L3)
- ⬜ affiliate_payouts Tabelle Einträge erstellen
- ⬜ Email an Partner mit Breakdown
- ⬜ Email an Admin mit Zusammenfassung

---

## 💸 SCHRITT 4: AUSZAHLUNG (Semi-automatisch)

### Flow:
```
Admin Panel: /admin/payouts
    ↓
Admin sieht: "12 Payouts pending, Gesamt €892.30"
    ↓
Für jeden Payout:
  ┌─────────────────────────────────────────┐
  │ Partner: Max Müller                      │
  │ Tier: Silber                             │
  │ Provision: €50.85                        │
  │ Methode: USDT (Wallet: 0x3f...8a2)     │
  │ KYC: ✅ Verifiziert                     │
  │                                          │
  │ [✅ Freigeben]  [❌ Ablehnen]  [⏸ Hold] │
  └─────────────────────────────────────────┘
    ↓
Admin klickt "Freigeben"
    ↓
  Option A: MANUELL (Phase 1)
    → Admin überweist selbst via Crypto Wallet / Bank
    → Markiert als "paid" im System
    → Partner bekommt Email: "€50.85 wurde ausgezahlt"
    
  Option B: AUTOMATISCH (Phase 2)
    → System sendet Crypto via Cryptomus Payout API
    → Oder: Stripe Connect Payout (für Bank)
    → Status: "processing" → "paid"
    → Partner bekommt Email + TX Hash
```

### Auto-Payout Regeln (Phase 2):
```
AUTOMATISCH freigeben wenn ALLE zutreffen:
  ✅ Betrag < €500
  ✅ Partner ist KYC-verifiziert
  ✅ Account aktiv seit > 90 Tagen
  ✅ Kein offenes Support Ticket
  ✅ Keine Fraud-Flags
  
ADMIN-QUEUE wenn:
  ❌ Betrag >= €500
  ❌ Erster Payout überhaupt
  ❌ Fraud-Score > 50
  ❌ Account < 90 Tage alt
```

### Auszahlungsmethoden:
```
Crypto (via Cryptomus Payout API):
  - USDT (TRC20) — günstig, schnell
  - BTC — teurer, langsamer
  - ETH — mittel
  → Mindest-Auszahlung: €20
  → Gebühr: 1-2% (Netzwerk-Fee)

Bank (via Stripe Connect — Phase 2):
  - SEPA Überweisung (EU)
  - SWIFT (International)
  → Mindest-Auszahlung: €50
  → Gebühr: €1.50 (SEPA) / €5 (SWIFT)
```

### Was wir haben: ✅ Cryptomus Client existiert
### Was fehlt:
- ⬜ Admin Panel Payout-Seite
- ⬜ Payout Freigabe-Workflow
- ⬜ Cryptomus Payout API Integration (für automatische Auszahlung)
- ⬜ Email bei Auszahlung + TX Hash
- ⬜ Auto-Payout Regeln
- ⬜ Stripe Connect (Phase 2, für Bank-Auszahlungen)

---

## 📊 SCHRITT 5: PROFIT SHARING (60/40 Split)

### Wann:
Monatlich, am 1. des Monats (nach Commission Calculation)

### Flow:
```
Für jeden aktiven Copier-User:
    ↓
  1. Berechne Monatsgewinn:
     Trades diesen Monat mit P&L > 0 summieren
     Beispiel: User hat €1.200 Gewinn gemacht
    ↓
  2. Split berechnen:
     60% → Investor (User): €720
     40% → Plattform:       €480
    ↓
  3. Plattform-Anteil aufteilen:
     Von den 40% (€480):
       → Gold Foundry:           €350 (nach Partner-Provision)
       → Partner-Provision:       €130 (wenn via Referral gekommen)
    ↓
  4. Abrechnung erstellen:
     INSERT INTO profit_settlements (
       user_id, period, gross_profit, investor_share,
       platform_share, partner_share, status
     )
    ↓
  5. Email an User:
     "Dein Performance Report für März:
      Brutto Gewinn: €1.200
      Dein Anteil (60%): €720
      Gold Foundry Gebühr (40%): €480"
```

### Was wir haben: ✅ Profit Engine existiert
### Was fehlt:
- ⬜ Automatischer Monats-Cron
- ⬜ Email mit Performance + Settlement Report
- ⬜ Dashboard-Anzeige: "Mein Profit Share diesen Monat"

---

## 🔄 DER KOMPLETTE GELDFLUSS (Zusammenfassung)

```
USER ZAHLT (Stripe/Cryptomus)
    │
    ├──→ Account wird aktiviert
    ├──→ Welcome Email
    ├──→ Copier startet
    │
    │   ┌── JEDEN MONAT ──┐
    │   │                  │
    │   │  Subscription    │
    │   │  wird belastet   │
    │   │       │          │
    │   │       ▼          │
    │   │  Erfolgreich?    │
    │   │  JA → Verlängern │
    │   │  NEIN → Grace    │
    │   │  Period → Dunning│
    │   │  → Pause → Churn │
    │   └──────────────────┘
    │
    ├──→ PROFIT SHARING (monatlich)
    │     User bekommt 60% der Gewinne
    │     Plattform bekommt 40%
    │
    └──→ AFFILIATE PROVISION (monatlich)
          Partner bekommt L1/L2/L3 Provision
          basierend auf Tier (30-50%)
              │
              ▼
          Payout erstellt (pending)
              │
              ▼
          Admin prüft (oder Auto-Approve)
              │
              ▼
          Auszahlung via Crypto/Bank
              │
              ▼
          Partner bekommt Email + Geld
```

---

## 📋 PARTNER DASHBOARD (was der Partner sieht)

```
┌─────────────────────────────────────────────┐
│ 💎 PARTNER DASHBOARD — Max Müller           │
│ Tier: SILBER (35% L1, 10% L2)              │
│ Nächster Tier: GOLD (noch 10 Referrals)     │
│                                             │
│ DIESEN MONAT                                │
│ ┌─────────────────────────────────────────┐ │
│ │ Provision:        €50.85               │ │
│ │ L1 (3 Referrals): €47.95              │ │
│ │ L2 (1 Sub-Ref):   €2.90               │ │
│ │ Status:            ⏳ Pending          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ MEINE REFERRALS (3 aktiv, 1 inaktiv)       │
│ ┌─────────────────────────────────────────┐ │
│ │ 🟢 Anna S. — Signal Pro €79 — seit 4Mo│ │
│ │ 🟢 Tom K.  — Copier €29   — seit 2Mo  │ │
│ │ 🟢 Lisa M. — Copier €29   — seit 1Mo  │ │
│ │ 🔴 Jan P.  — Inaktiv seit 3 Wochen    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ MEIN REFERRAL LINK                          │
│ ┌─────────────────────────────────────────┐ │
│ │ goldfoundry.de/r/max-mueller            │ │
│ │ [📋 Kopieren] [📊 QR Code] [📱 Teilen]│ │
│ │ 47 Klicks · 4 Signups · 3 Conversions  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ AUSZAHLUNGS-HISTORIE                        │
│ Feb 2026: €42.30  ✅ Ausgezahlt (USDT)     │
│ Jan 2026: €38.15  ✅ Ausgezahlt (USDT)     │
│ Dez 2025: €25.70  ✅ Ausgezahlt (USDT)     │
│                                             │
│ MATERIAL                                    │
│ [🖼 Banner] [📝 Texte] [🎬 Videos] [📊 LP]│
│                                             │
│ WALLET EINSTELLUNGEN                        │
│ Methode: USDT (TRC20)                      │
│ Adresse: TQn7...8a2f                        │
│ [Ändern]                                    │
└─────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION — Was Claude Code morgen bauen muss

### Cron Routes (im Master Cron):
```
Am 1. des Monats, 01:00 UTC:
  → /api/cron/profit-settlement    (60/40 Split berechnen)
  → /api/cron/calculate-commissions (Partner-Provisionen)
  → /api/cron/create-payouts       (Payout-Einträge erstellen)
  → /api/cron/send-reports         (Emails an alle)

Täglich 10:00 UTC:
  → /api/cron/dunning              (Zahlungserinnerungen)
```

### API Routes:
```
POST /api/stripe/webhook
  → invoice.paid: Plan verlängern
  → invoice.payment_failed: Grace Period starten
  → customer.subscription.deleted: Account pausieren

POST /api/cryptomus/webhook
  → payment.confirmed: Account aktivieren

GET /api/dashboard/partner
  → Partner Dashboard Daten

POST /api/admin/payouts/approve
  → Payout freigeben
  
POST /api/admin/payouts/reject
  → Payout ablehnen mit Grund
```

### Datenbank (in bestehende affiliate_payouts Tabelle):
```sql
-- Schon in Migration 005, aber erweitern:
ALTER TABLE affiliate_payouts ADD COLUMN IF NOT EXISTS
  l1_amount DECIMAL DEFAULT 0,
  l2_amount DECIMAL DEFAULT 0,
  l3_amount DECIMAL DEFAULT 0,
  payout_method TEXT,           -- 'usdt_trc20', 'btc', 'sepa'
  wallet_address TEXT,
  tx_hash TEXT,                 -- Blockchain TX Hash
  approved_by UUID,             -- Admin der freigegeben hat
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT;
```
