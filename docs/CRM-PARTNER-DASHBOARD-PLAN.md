# GOLD FOUNDRY — CRM ERWEITERUNG FÜR PARTNER/MLM
## Was wir haben, was fehlt, kompletter Darstellungsplan

---

## 🔍 IST-ZUSTAND: WAS DAS CRM AKTUELL KANN

```
VORHANDEN (für Trader/User):
  ✅ crm_leads Tabelle (Lead Score, Churn Risk)
  ✅ crm_activities (Login, Signup, Copier Start, Trade)
  ✅ crm_email_queue (Welcome, Win-Back Emails)
  ✅ Lead Scoring (0-100, basierend auf Aktivität)
  ✅ Churn Detection (14+ Tage inaktiv)
  ✅ Win-Back Email Trigger

FEHLT KOMPLETT (für Partner/MLM):
  ❌ Partner Pipeline (neuer Partner → aktiv → Leader)
  ❌ Partner Performance Tracking
  ❌ Netzwerk-Wachstum über Zeit
  ❌ Provisions-Übersicht (vergangen + Forecast)
  ❌ Community Metrics (Gesamt-Wachstum)
  ❌ Revenue Forecasting
  ❌ Admin Dashboard für Partner-Management
  ❌ Payout-Übersicht + Freigabe
  ❌ KYC-Verwaltung
  ❌ Fraud Detection Dashboard
```

---

## 🖥️ DER PLAN: 3 DASHBOARDS

### DASHBOARD 1: ADMIN OVERVIEW (für dich, Eric)
### DASHBOARD 2: PARTNER CRM (Partner verwalten)
### DASHBOARD 3: BUSINESS INTELLIGENCE (Zahlen + Forecast)

---

## 📊 DASHBOARD 1: ADMIN OVERVIEW

Route: /admin/overview

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 GOLD FOUNDRY — ADMIN OVERVIEW                             │
│ Stand: 17. März 2026, 14:32 UTC                              │
│                                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│ │ €34.200  │ │ 1.247    │ │ 89       │ │ €12.400          │ │
│ │ MRR      │ │ Aktive   │ │ Neue     │ │ Pending          │ │
│ │ +12% ▲  │ │ User     │ │ diese Wo │ │ Payouts          │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
│                                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│ │ 342      │ │ 67       │ │ 4.8%     │ │ €17.100          │ │
│ │ Aktive   │ │ Neue     │ │ Churn    │ │ Provision        │ │
│ │ Partner  │ │ Partner  │ │ Rate     │ │ diesen Mo        │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
│                                                               │
│ 📈 MRR ENTWICKLUNG (letzte 6 Monate)                        │
│ ┌────────────────────────────────────────────────────────┐   │
│ │  €34K ─────────────────────────────────────● heute     │   │
│ │  €28K ──────────────────────────●                      │   │
│ │  €22K ─────────────────●                               │   │
│ │  €16K ────────●                                        │   │
│ │  €11K ───●                                             │   │
│ │  €7K  ●                                                │   │
│ │  Okt   Nov   Dez   Jan   Feb   Mär                     │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ ⚡ QUICK ACTIONS:                                            │
│ [🔴 8 Payouts freigeben] [🟡 3 KYC prüfen]                 │
│ [🟡 12 Partner im Churn-Risk] [🟢 System: Healthy]         │
│                                                               │
│ 📊 REVENUE SPLIT DIESEN MONAT:                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Gesamt Revenue:        €34.200                         │   │
│ │ ├── An Partner (Prov.): €17.100 (50%)                  │   │
│ │ │   ├── Unilevel:       €11.200                        │   │
│ │ │   ├── Performance:    €2.800                         │   │
│ │ │   ├── Matching:       €1.400                         │   │
│ │ │   ├── Rang-Bonus:     €980                           │   │
│ │ │   ├── Contests:       €420                           │   │
│ │ │   └── Pool:           €300                           │   │
│ │ └── Gold Foundry:       €17.100 (50%)                  │   │
│ │     ├── Infra/Hosting:  €2.100                         │   │
│ │     ├── AI/API Kosten:  €890                           │   │
│ │     └── Netto Marge:    €14.110                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ ⚠️ ALERTS:                                                   │
│ • 3 Partner haben Fraud-Score > 70                           │
│ • Churn Rate steigt seit 2 Wochen (4.2% → 4.8%)             │
│ • Crown Leader "Max M." hat nur 6 neue Refs (Min: 10)       │
│ • Builder Pack Code-Einlöse-Rate unter 50%                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 👥 DASHBOARD 2: PARTNER CRM

Route: /admin/partners

### 2A: Partner Pipeline
```
┌──────────────────────────────────────────────────────────────┐
│ 👥 PARTNER PIPELINE                                          │
│                                                               │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│ │ SIGNUP      │→ │ AKTIV       │→ │ PRODUCING   │           │
│ │ 234 total   │  │ 187 (80%)   │  │ 142 (61%)   │           │
│ │ +23 diese Wo│  │ Plan bezahlt│  │ Min 1 Ref   │           │
│ └─────────────┘  └─────────────┘  └─────────────┘           │
│       ↓               ↓                ↓                     │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│ │ CHURNED     │  │ INACTIVE    │  │ LEADER      │           │
│ │ 47 (20%)    │  │ 45 (19%)    │  │ 38 (16%)    │           │
│ │ Plan gekündi│  │ >30d nichts │  │ Gold+, aktiv│           │
│ └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                               │
│ CONVERSION RATES:                                            │
│ Signup → Aktiv: 80% (Ziel: 85%)                             │
│ Aktiv → Producing: 76% (Ziel: 80%)                          │
│ Producing → Leader: 27% (Ziel: 30%)                         │
│ Overall Churn: 4.8% (Ziel: <5%)                             │
└──────────────────────────────────────────────────────────────┘
```

### 2B: Partner Liste (Tabelle, sortierbar, filterbar)
```
┌──────────────────────────────────────────────────────────────┐
│ 👥 ALLE PARTNER                                              │
│ [Filter: Rang ▼] [Filter: Status ▼] [Suche: ___________]   │
│                                                               │
│ PARTNER      │ RANG    │ REFS │ NETZWERK │ FP/Mo  │ STATUS  │
│──────────────┼─────────┼──────┼──────────┼────────┼─────────│
│ Max Müller   │ 👑Crown │ 142  │ 35.210   │145.700 │ ✅ Aktiv│
│ Anna Schmidt │ 💎Diam. │ 67   │ 8.420    │ 52.000 │ ✅ Aktiv│
│ Chris Decker │ 🥇Gold  │ 22   │ 890      │  4.800 │ ✅ Aktiv│
│ Tom König    │ 🥈Silber│ 9    │ 145      │  1.200 │ ⚡ Rising│
│ Lisa Weber   │ 🥉Bronze│ 4    │ 32       │    870 │ ✅ Aktiv│
│ Jan Peters   │ ⭐Start │ 2    │ 8        │    180 │ ⚠️ Risk │
│ Sarah Koch   │ 🥈Silber│ 8    │ 120      │    950 │ 🔴 Maint│
│──────────────┼─────────┼──────┼──────────┼────────┼─────────│
│                                                               │
│ 🔴 Maintenance = Qualifikation nicht erfüllt (50% Provision)│
│ ⚠️ Risk = Churn-Risiko (>14 Tage keine Aktivität)           │
│ ⚡ Rising = Schnelles Wachstum, potentieller Leader          │
│                                                               │
│ [📥 Export CSV] [📧 Bulk Email] [📊 Vergleich]              │
└──────────────────────────────────────────────────────────────┘
```

### 2C: Partner Detail (Klick auf einen Partner)
```
┌──────────────────────────────────────────────────────────────┐
│ 👤 MAX MÜLLER — Crown Partner                                │
│ Seit: Oktober 2025 (5 Monate) · KYC: ✅ Level 2             │
│                                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│ │ 142      │ │ 35.210   │ │ 145.700  │ │ €342.000         │ │
│ │ Direkte  │ │ Netzwerk │ │ FP/Mo    │ │ Total            │ │
│ │ Refs     │ │ gesamt   │ │ aktuell  │ │ ausgezahlt       │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
│                                                               │
│ 📈 PERFORMANCE ÜBER ZEIT:                                    │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ [Graph: FP/Mo über letzte 12 Monate]                   │   │
│ │ [Graph: Netzwerk-Größe über letzte 12 Monate]          │   │
│ │ [Graph: Neue Refs/Mo über letzte 12 Monate]            │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ MONATLICHE QUALIFIKATION (dieser Monat):                     │
│ ✅ Selbst aktiv (Plan bezahlt)                               │
│ ✅ 142 aktive direkte Refs (Min: 100)                        │
│ ✅ 35.210 Netzwerk (Min: 10.000)                             │
│ ⚠️ 6 neue Refs (Min: 10) ← UNTER MINIMUM!                  │
│ ✅ €82.000 Team-Umsatz (Min: €80.000)                       │
│ → Status: 4/5 → MAINTENANCE RISK nächsten Monat             │
│                                                               │
│ PROVISIONS-HISTORIE:                                         │
│ Mär 26: 145.700 FP (€14.570) — Crown 100%                  │
│ Feb 26: 138.200 FP (€13.820) — Crown 100%                  │
│ Jan 26: 125.400 FP (€12.540) — Crown 100%                  │
│ Dez 25: 112.800 FP (€11.280) — Diamond                     │
│ Nov 25:  89.400 FP (€8.940) — Diamond                       │
│                                                               │
│ PAYOUTS:                                                     │
│ Feb 26: 120.000 FP → €12.000 USDT ✅ TX: 0x3f...           │
│ Jan 26: 110.000 FP → €11.000 USDT ✅ TX: 0x7a...           │
│                                                               │
│ NETZWERK TOP PERFORMER:                                      │
│ L1: Anna Schmidt (Diamond, 8.420 Netzwerk)                  │
│ L1: Chris Decker (Gold, 890 Netzwerk)                        │
│ L1: Tom König (Silber, 145 Netzwerk, Rising Star ⚡)        │
│                                                               │
│ ALERTS:                                                      │
│ ⚠️ Nur 6/10 neue Refs diesen Monat — Crown at risk         │
│ 📈 Team-Umsatz knapp über Minimum (€82K vs €80K)            │
│                                                               │
│ ADMIN ACTIONS:                                               │
│ [📧 Email senden] [📊 Netzwerk-Baum] [🔒 Account sperren] │
│ [💸 Manueller FP Credit] [📋 Notizen] [🏷️ Tags]           │
└──────────────────────────────────────────────────────────────┘
```

### 2D: Payouts Verwaltung
```
┌──────────────────────────────────────────────────────────────┐
│ 💸 PAYOUTS                                                    │
│ [Pending: 8] [Processing: 2] [Paid: 145] [Rejected: 3]      │
│                                                               │
│ PENDING (Freigabe nötig):                                    │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Max Müller     120.000 FP  €12.000  USDT  KYC ✅      │   │
│ │ Auto-Approve: ✅ (Verifiziert, >90d, <50K FP)         │   │
│ │ [✅ Freigeben] [❌ Ablehnen] [⏸ Hold]                │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ Anna Schmidt    45.000 FP  €4.500   USDT  KYC ✅      │   │
│ │ Auto-Approve: ✅                                       │   │
│ │ [✅ Freigeben] [❌ Ablehnen] [⏸ Hold]                │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ Jan Peters       5.200 FP  €520     SEPA  KYC ✅      │   │
│ │ Auto-Approve: ❌ (Erster Payout)                       │   │
│ │ [✅ Freigeben] [❌ Ablehnen] [⏸ Hold]                │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ DIESEN MONAT:                                                │
│ Total pending:    €12.400 (8 Payouts)                        │
│ Total processing: €3.200 (2 Payouts)                         │
│ Total paid:       €48.700 (34 Payouts)                       │
│                                                               │
│ [✅ Alle Auto-Approved freigeben (5 Payouts, €22.400)]      │
│ [📥 Export für Buchhaltung]                                  │
└──────────────────────────────────────────────────────────────┘
```

### 2E: KYC Verwaltung
```
┌──────────────────────────────────────────────────────────────┐
│ 🪪 KYC VERWALTUNG                                            │
│ [Pending: 3] [Approved: 187] [Rejected: 5]                  │
│                                                               │
│ PENDING:                                                     │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Tom König — Eingereicht: 15. März                      │   │
│ │ Name: Thomas König · DE · Geb: 14.03.1991             │   │
│ │ [📷 Ausweis Vorne] [📷 Ausweis Hinten] [📷 Selfie]  │   │
│ │ [✅ Approve] [❌ Reject: Grund angeben]               │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📈 DASHBOARD 3: BUSINESS INTELLIGENCE

Route: /admin/analytics

### 3A: Revenue Forecasting
```
┌──────────────────────────────────────────────────────────────┐
│ 📈 REVENUE FORECAST                                          │
│                                                               │
│ AKTUELLER MONAT (März):                                      │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Bisheriger Revenue (1.-17. März):    €19.800           │   │
│ │ Hochrechnung Ende März:              €34.200           │   │
│ │ Vormonat (Feb):                      €30.100           │   │
│ │ Wachstum:                            +13.6%            │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ PROGNOSE NÄCHSTE 3 MONATE:                                   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ April:   €38.500 (+12.6%) — basierend auf Pipeline     │   │
│ │ Mai:     €43.200 (+12.2%) — konservativ                │   │
│ │ Juni:    €48.000 (+11.1%) — bei gleichem Wachstum      │   │
│ │                                                         │   │
│ │ Basis: Aktuelle User × Ø Plan + Pipeline Conversions   │   │
│ │        - erwartete Churn (4.8%)                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ PROVISIONEN FORECAST:                                        │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Voraussichtlich diesen Monat an Partner:               │   │
│ │ Unilevel:      €11.200 (33% vom Revenue)               │   │
│ │ Performance:   €2.800                                   │   │
│ │ Matching:      €1.400                                   │   │
│ │ Rang-Bonus:    €980                                     │   │
│ │ Contests:      €420                                     │   │
│ │ Pool:          €300                                     │   │
│ │ TOTAL:         €17.100 (50%)                           │   │
│ │ GF Marge:      €17.100 (50%)                           │   │
│ │                                                         │   │
│ │ ℹ️ Effektive Ausschüttungsrate: 42.3%                  │   │
│ │ (Unter 50% weil flache Strukturen + Compression)       │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ EINNAHMEN NACH PLAN:                                         │
│ Copier (€29):       487 User  = €14.123 (41%)               │
│ Signal Start (€49): 312 User  = €15.288 (45%)               │
│ Signal Pro (€79):    89 User  = €7.031 (21%)                │
│ Unlimited (€149):    12 User  = €1.788 (5%)                 │
│ Builder Packs:       €2.970 (einmalig diesen Monat)          │
└──────────────────────────────────────────────────────────────┘
```

### 3B: Community Wachstum
```
┌──────────────────────────────────────────────────────────────┐
│ 🌐 COMMUNITY WACHSTUM                                        │
│                                                               │
│ DIESE WOCHE:                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│ │ +89      │ │ +67      │ │ +23      │ │ -12              │ │
│ │ Neue     │ │ Neue     │ │ Neue     │ │ Churned          │ │
│ │ Signups  │ │ Zahlende │ │ Partner  │ │ User             │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
│                                                               │
│ WACHSTUM LETZTE 12 WOCHEN:                                   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ [Bar Chart: Neue User pro Woche]                       │   │
│ │ KW8: 45 | KW9: 52 | KW10: 61 | KW11: 89 ← diese Wo  │   │
│ │ Trend: ↗️ +23% Woche über Woche                       │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ SIGNUP → ZAHLUNG CONVERSION:                                 │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Gesamt Signups:    2.340                               │   │
│ │ Davon bezahlt:     1.247 (53.3%)                       │   │
│ │ Davon aktiv:       1.089 (46.5%)                       │   │
│ │ Davon Partner:       342 (14.6%)                       │   │
│ │                                                         │   │
│ │ Ø Tage bis Zahlung: 2.1 Tage                           │   │
│ │ Ø Tage bis erster Trade: 4.7 Tage                      │   │
│ │ Ø Tage bis erster Ref (Partner): 12.3 Tage             │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ CHURN ANALYSE:                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Churn Rate (30d Rolling): 4.8%                         │   │
│ │ Wo churnen die meisten?                                │   │
│ │   Monat 1: 22% (nach Rabatt-Monat!)                   │   │
│ │   Monat 2: 8%                                          │   │
│ │   Monat 3: 5%                                          │   │
│ │   Monat 4+: 2.1% (stabil)                             │   │
│ │                                                         │   │
│ │ → Fokus: Monat-1-Retention verbessern (22% ist zu hoch)│   │
│ │ → Idee: Onboarding Wizard + 7-Tage Email Sequenz       │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ TOP TRAFFIC QUELLEN:                                         │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Partner Links: 62% aller Signups                       │   │
│ │ SEO organisch: 18%                                     │   │
│ │ Direkt:        12%                                     │   │
│ │ Social Media:   8%                                     │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ PARTNER RANG-VERTEILUNG:                                     │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Starter:  98 (28.7%)  ██████████                       │   │
│ │ Bronze:   87 (25.4%)  █████████                        │   │
│ │ Silber:   78 (22.8%)  ████████                         │   │
│ │ Gold:     42 (12.3%)  █████                            │   │
│ │ Platin:   21 (6.1%)   ███                              │   │
│ │ Diamond:  12 (3.5%)   ██                               │   │
│ │ Crown:     4 (1.2%)   █                                │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 3C: Partner Einzahlungs-Übersicht
```
┌──────────────────────────────────────────────────────────────┐
│ 💰 PARTNER EINZAHLUNGEN                                      │
│                                                               │
│ WAS PARTNER EINGEZAHLT HABEN:                                │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Subscriptions (laufend):                               │   │
│ │   342 Partner × Ø €32/Mo = €10.944/Mo                 │   │
│ │                                                         │   │
│ │ Builder Packs (einmalig, diesen Monat):                │   │
│ │   12× 5er Pack (€99):    €1.188                        │   │
│ │   8× 10er Pack (€179):   €1.432                        │   │
│ │   3× 25er Pack (€399):   €1.197                        │   │
│ │   1× 50er Pack (€699):   €699                          │   │
│ │   Pack Revenue:           €4.516                        │   │
│ │                                                         │   │
│ │ Pack Code Einlöse-Rate:   67% (Ziel: 75%)             │   │
│ │ Pack → Weiterzahlung:     48% (nach Gratis-Monat)      │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ LIFETIME VALUE PRO PARTNER:                                  │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Starter:  Ø €87 (3 Monate Lebensdauer)                │   │
│ │ Bronze:   Ø €232 (8 Monate)                            │   │
│ │ Silber:   Ø €580 (14 Monate)                           │   │
│ │ Gold:     Ø €1.740 (24+ Monate)                        │   │
│ │ Diamond+: Ø €4.200+ (24+ Monate, inkl. Packs)         │   │
│ │                                                         │   │
│ │ → Gold+ Partner sind 20× wertvoller als Starter.       │   │
│ │ → Fokus: Starter → Bronze → Silber Conversion          │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 TECHNISCHE UMSETZUNG

### Neue Datenbank-Views (für schnelle Dashboard Queries):
```sql
-- Monatliche Aggregate (materialized, täglich refreshed)
CREATE MATERIALIZED VIEW mv_monthly_stats AS
SELECT 
  date_trunc('month', created_at) as month,
  COUNT(*) FILTER (WHERE type = 'signup') as new_signups,
  COUNT(*) FILTER (WHERE type = 'payment') as new_paying,
  COUNT(*) FILTER (WHERE type = 'partner_signup') as new_partners,
  SUM(amount) FILTER (WHERE type = 'payment') as total_revenue,
  SUM(amount) FILTER (WHERE type = 'commission') as total_commissions
FROM events
GROUP BY 1;

-- Partner Performance Summary
CREATE MATERIALIZED VIEW mv_partner_performance AS
SELECT
  p.id,
  p.display_name,
  p.referral_slug,
  fp.balance as fp_balance,
  fp.total_earned as fp_total,
  fp.level,
  (SELECT COUNT(*) FROM profiles WHERE referred_by = p.id AND plan_active = true) as active_refs,
  (SELECT COUNT(*) FROM network_tree WHERE ancestor_id = p.id AND depth > 0) as network_size,
  (SELECT SUM(amount) FROM fp_transactions WHERE user_id = p.id AND created_at > date_trunc('month', now())) as fp_this_month
FROM profiles p
JOIN forge_points fp ON fp.user_id = p.id
WHERE p.is_partner = true;

-- Revenue Forecast
CREATE VIEW v_revenue_forecast AS
SELECT
  COUNT(*) FILTER (WHERE plan_active = true) as active_users,
  AVG(plan_price) as avg_plan_price,
  COUNT(*) FILTER (WHERE plan_active = true) * AVG(plan_price) as projected_mrr,
  (SELECT AVG(churn_rate) FROM mv_monthly_stats WHERE month > now() - interval '3 months') as avg_churn
FROM profiles;
```

### Neue API Routes:
```
/api/admin/overview          → Haupt-KPIs
/api/admin/partners          → Partner Liste (paginated, filterable)
/api/admin/partners/[id]     → Partner Detail
/api/admin/payouts           → Payout Queue
/api/admin/payouts/approve   → Batch Approve
/api/admin/kyc               → KYC Queue
/api/admin/kyc/[id]/approve  → KYC Approve/Reject
/api/admin/analytics/revenue → Revenue + Forecast
/api/admin/analytics/growth  → Community Wachstum
/api/admin/analytics/churn   → Churn Analyse
/api/admin/analytics/partners→ Partner Performance
/api/admin/fraud             → Fraud Detection
```

### Neue Dateien:
```
src/app/admin/
  ├── overview/page.tsx        ← Dashboard 1: Overview
  ├── partners/
  │   ├── page.tsx             ← Partner Liste + Pipeline
  │   └── [id]/page.tsx        ← Partner Detail
  ├── payouts/page.tsx         ← Payout Verwaltung
  ├── kyc/page.tsx             ← KYC Queue
  ├── analytics/
  │   ├── revenue/page.tsx     ← Revenue + Forecast
  │   ├── growth/page.tsx      ← Community Wachstum
  │   ├── churn/page.tsx       ← Churn Analyse
  │   └── partners/page.tsx    ← Partner Performance
  └── fraud/page.tsx           ← Fraud Detection

src/lib/crm/
  ├── lead-manager.ts          ← BESTEHT (für Trader)
  ├── partner-manager.ts       ← NEU (für Partner)
  ├── analytics-engine.ts      ← NEU (Aggregation + Forecast)
  └── fraud-detector.ts        ← NEU (Anomaly Detection)
```

### Cron Jobs (im Master Cron):
```
Täglich 00:30:  REFRESH MATERIALIZED VIEW mv_monthly_stats
Täglich 00:35:  REFRESH MATERIALIZED VIEW mv_partner_performance
Täglich 01:00:  runFraudDetection()
Wöchentlich Mo: generateWeeklyAdminReport() → Email an Eric
Monatlich 1.:   generateMonthlyBusinessReport() → PDF
```
