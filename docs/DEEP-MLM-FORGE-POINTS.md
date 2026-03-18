# FORGE POINTS — DEEP MLM STRUKTUR
## 10 Level tief. Leader verdienen richtig.

---

## 🏗️ DIE TIEFE STRUKTUR

### Das alte System (zu flach):
```
Bronze: L1 30%
Silber: L1 35%, L2 10%
Gold:   L1 40%, L2 12%, L3 5%
Diamond: L1 50%, L2 15%, L3 8%
```
→ Maximal 3 Level tief. Leader verdienen nur an direkten Kontakten.

### Das NEUE System (10 Level tief):

```
TIER       | REFS | L1   | L2   | L3  | L4  | L5  | L6  | L7   | L8   | L9   | L10
-----------+------+------+------+-----+-----+-----+-----+------+------+------+-----
Bronze     | 1+   | 30%  | 5%   | 2%  | —   | —   | —   | —    | —    | —    | —
Silber     | 5+   | 35%  | 10%  | 5%  | 3%  | 1%  | —   | —    | —    | —    | —
Gold       | 15+  | 40%  | 12%  | 5%  | 3%  | 2%  | 1%  | 0.5% | —    | —    | —
Diamond    | 50+  | 50%  | 15%  | 8%  | 5%  | 3%  | 2%  | 1%   | 0.5% | 0.25%| 0.1%
```

### Warum das MEGA ist für Leader:

Wenn JEDER nur 3 Leute einlädt:
```
L1:   3 User          ← Du wirbst direkt
L2:   9 User          ← Deine Refs werben
L3:   27 User         ← Und deren Refs...
L4:   81 User
L5:   243 User
L6:   729 User
L7:   2.187 User
L8:   6.561 User
L9:   19.683 User
L10:  59.049 User
─────────────────
TOTAL: 88.572 User in deinem Netzwerk
```

Ein Diamond Leader mit diesem Netzwerk (unrealistisch dass ALLE aktiv, aber zeigt das Potential):
```
L1:   3 × €29 × 50%    = €43.50/Mo
L2:   9 × €29 × 15%    = €39.15/Mo
L3:   27 × €29 × 8%    = €62.64/Mo
L4:   81 × €29 × 5%    = €117.45/Mo
L5:   243 × €29 × 3%   = €211.41/Mo
L6:   729 × €29 × 2%   = €422.82/Mo
L7:   2.187 × €29 × 1% = €634.23/Mo
L8:   6.561 × €29 × 0.5% = €951.35/Mo
L9:   19.683 × €29 × 0.25% = €1.427.02/Mo
L10:  59.049 × €29 × 0.1% = €1.712.42/Mo
───────────────────────────────────
TOTAL: €5.621.99/Mo = 56.220 FP/Mo
```

REALISTISCHER (10% Aktivitätsrate):
```
~8.857 aktive User → ~€562/Mo
Ab 30% aktiv → ~€1.687/Mo
```

DAS ist der Pitch für Leader: "Mit Gold Foundry verdienst du nicht
nur an deinen direkten Kontakten. Du verdienst an JEDEM Trader
in deinem Netzwerk — bis zu 10 Level tief."

---

## 💰 AUSZAHLUNGS-REGELN

### Minimum: 5.000 FP (= €500)
Warum €500 und nicht weniger:
- Weniger Transaktionen = weniger Gebühren
- Verhindert Micro-Fraud (Fake-Accounts für kleine Auszahlungen)
- Motiviert zum Weitermachen ("Ich brauch noch 1.200 FP!")
- Professioneller Eindruck

### Auszahlungsmethoden:
```
USDT (TRC20):  Gebühr 100 FP (€10). Schnellste Option, <24h.
USDT (ERC20):  Gebühr 200 FP (€20). Teurer wegen Gas.
BTC:           Gebühr 150 FP (€15). 1-3h Bestätigung.
ETH:           Gebühr 200 FP (€20). Variable Gas Fees.
SEPA Bank:     Gebühr 30 FP (€3). 1-3 Werktage. Nur EU.
SWIFT Bank:    Gebühr 100 FP (€10). 3-5 Werktage. International.
```

### Auszahlungs-Zyklen:
```
Standard: 1× pro Monat (am 15.)
Silber+:  2× pro Monat (1. und 15.)
Gold+:    Wöchentlich (jeden Montag)
Diamond:  On-Demand (jederzeit, innerhalb 48h)
```

### Auto-Approve Regeln:
```
AUTOMATISCH freigeben wenn ALLE zutreffen:
  ✅ KYC verifiziert
  ✅ Account > 90 Tage alt
  ✅ Betrag < 50.000 FP (€5.000)
  ✅ Kein Fraud-Flag
  ✅ Nicht erster Payout (erster immer manuell)

ADMIN QUEUE wenn:
  ❌ Erster Payout
  ❌ Betrag > 50.000 FP
  ❌ Account < 90 Tage
  ❌ Fraud Score > 50
```

---

## 🛡️ ANTI-FRAUD SYSTEM

### Manipulation verhindern:
```
1. SELF-REFERRAL BLOCK
   Gleiche IP bei Referrer + Referral → Block
   Gleiche Zahlungsmethode → Block
   Gleiche Device Fingerprint → Block

2. GHOST ACCOUNT DETECTION
   Referral meldet sich an, zahlt 1 Monat, churnt → Punkte zurückbuchen
   Minimum 3 Monate aktiv bevor Punkte "vested" sind
   
3. VESTING SCHEDULE
   Monat 1: Punkte gutgeschrieben aber LOCKED (nicht auszahlbar)
   Monat 2: 50% werden unlocked
   Monat 3: 100% unlocked
   → Verhindert: Anmelden, 1 Monat zahlen, Punkte kassieren, churnen

4. VELOCITY CHECK
   >10 Signups aus gleicher IP in 24h → Freeze + Admin Alert
   >20 Signups aus gleichem Land in 1h → Prüfung
   
5. CHARGEBACK PROTECTION
   Wenn Referral eine Stripe Chargeback macht:
   → Alle gutgeschriebenen FP werden ZURÜCKGEBUCHT
   → Partner wird gewarnt
   → Bei 3+ Chargebacks: Partner Account Review
   
6. QUALITY SCORE
   Jeder Referral bekommt einen Quality Score:
     - Zahlt regelmäßig: +30
     - Nutzt die Plattform aktiv: +20
     - Hat eigene Referrals: +20
     - Broker verbunden: +15
     - Copier aktiv: +15
   Score < 30 → Punkte reduziert
   Score > 80 → Bonus Punkte
```

---

## 🎮 GAMIFICATION — KOMPLETT

### Level-System (Lifetime FP earned):
```
Level 1:  Newcomer        0 FP        → Basis-Zugang
Level 2:  Apprentice      500 FP      → Badge im Profil
Level 3:  Trader          2.000 FP    → Kann Trades teilen
Level 4:  Specialist      5.000 FP    → Priority Support
Level 5:  Expert          10.000 FP   → Early Access Features
Level 6:  Master          25.000 FP   → Featured im Leaderboard
Level 7:  Elite           50.000 FP   → Eigene Affiliate LP
Level 8:  Legend           100.000 FP  → VIP Events + Merch
Level 9:  FORGE Master    250.000 FP  → Direct Payout + Custom LP
Level 10: Gold God        1.000.000 FP → Advisory Board Invite
```

### Achievements (15 Badges):
```
TRADING:
🏅 First Blood       — Erster profitabler Trade
🔥 Hot Streak        — 5 Wins am Stück
💎 Diamond Hands     — Position > 24h profitabel geschlossen
⚡ Speed Demon       — Trade < 5 Min profitabel
🛡️ Risk Master      — 30 Tage ohne DD > 5%
📈 Moon Shot         — +10% in einem Monat
👑 Challenge King    — 3 Challenges bestanden

NETWORK:
🤝 Recruiter         — 1. Referral geworben
🌟 Team Builder      — 10 aktive Referrals
🏢 Network Boss      — 50 aktive Referrals (Diamond Tier)
🌍 Global Leader     — Referrals in 5+ Ländern
💰 6-Figure Club     — 100.000 FP Lifetime earned

PLATFORM:
🧠 AI Whisperer      — 50 Mentor-Chats geführt
📊 Data Nerd         — 100 Journal-Einträge
⭐ Community Star     — 10 Social Posts mit 5+ Likes
```

### Tier-Aufstieg Ceremony:
```
Wenn Partner neuen Tier erreicht:
  1. Konfetti-Animation im Dashboard
  2. Email: "Herzlichen Glückwunsch! Du bist jetzt GOLD Partner!"
  3. Neues Badge im Profil
  4. Bonus: 500 FP (Silber), 1.000 FP (Gold), 5.000 FP (Diamond)
  5. Announcement im Partner-Feed
  6. Neuer Tier schaltet tiefere Levels frei
```

---

## 📊 DASHBOARD WIDGETS

### Haupt-Widget: FP Balance
```
┌──────────────────────────────────────┐
│ 🪙 FORGE POINTS                     │
│                                      │
│     12.847 FP                        │
│     = €1.284.70                      │
│                                      │
│ ███████████████░░░░░ Level 5 Expert  │
│ 12.847 / 25.000 → Level 6 Master    │
│                                      │
│ 🔥 Streak: 23 Tage                  │
│ 💎 Tier: Gold (7 Level tief)        │
│                                      │
│ Diesen Monat: +1.247 FP             │
│ Locked (Vesting): 380 FP            │
│ Auszahlbar: 12.467 FP               │
│                                      │
│ [💸 Auszahlen] [🛒 Shop] [📊 Log]  │
└──────────────────────────────────────┘
```

### Netzwerk-Widget:
```
┌──────────────────────────────────────┐
│ 🌐 MEIN NETZWERK                    │
│                                      │
│ Direkte Refs (L1):    12 aktiv      │
│ Gesamtes Netzwerk:    347 User      │
│ Aktive User:          198 (57%)     │
│                                      │
│ L1: ████████████ 12                  │
│ L2: █████████████████ 38            │
│ L3: ██████████████████████ 67       │
│ L4: █████████████████████████ 89    │
│ L5: ████████████████████████ 78     │
│ L6: ████████████████ 42             │
│ L7: ████████ 21                      │
│                                      │
│ 📈 +23 neue User diese Woche       │
│ 💰 +1.247 FP diese Woche           │
│                                      │
│ [Netzwerk-Baum anzeigen]            │
└──────────────────────────────────────┘
```

### Netzwerk-Baum (Drill-Down):
```
┌──────────────────────────────────────┐
│ 🌳 NETZWERK-BAUM                    │
│                                      │
│ 👑 Du (Gold Tier)                    │
│ ├── 🟢 Anna S. (Silber)             │
│ │   ├── 🟢 Tom K.                    │
│ │   │   ├── 🟢 Lisa M.              │
│ │   │   └── 🔴 Jan P. (inaktiv)    │
│ │   ├── 🟢 Sarah B.                 │
│ │   └── 🟡 Mike R. (trial)          │
│ ├── 🟢 Chris D. (Bronze)            │
│ │   ├── 🟢 Eva L.                   │
│ │   └── 🟢 Paul W.                  │
│ │       └── 🟢 Nina F.              │
│ └── 🟢 Yusuf A.                     │
│     └── 🟢 Ahmed K.                 │
│         ├── 🟢 Fatima S.            │
│         ├── 🟢 Omar M.              │
│         └── 🟢 Hassan R.            │
│                                      │
│ 🟢 Aktiv  🟡 Trial  🔴 Inaktiv     │
│                                      │
│ [Filter: Nur aktive] [Export CSV]    │
└──────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION

### Datenbank (Migration 008):
```sql
-- FP-Konten
CREATE TABLE IF NOT EXISTS forge_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  balance INTEGER DEFAULT 0,
  locked_balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_login DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transaktions-Log
CREATE TABLE IF NOT EXISTS fp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  description TEXT,
  source_user_id UUID,
  source_level INTEGER,
  vested BOOLEAN DEFAULT false,
  vested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Netzwerk-Hierarchie (für schnelle Deep Queries)
CREATE TABLE IF NOT EXISTS network_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ancestor_id UUID REFERENCES profiles(id),
  descendant_id UUID REFERENCES profiles(id),
  depth INTEGER NOT NULL,
  UNIQUE(ancestor_id, descendant_id)
);
-- Closure Table Pattern: ermöglicht schnelle "Alle meine L1-L10" Queries

-- Achievements
CREATE TABLE IF NOT EXISTS fp_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  achievement TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement)
);

-- Payout Requests
CREATE TABLE IF NOT EXISTS fp_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount_fp INTEGER NOT NULL,
  amount_eur DECIMAL NOT NULL,
  fee_fp INTEGER DEFAULT 0,
  method TEXT NOT NULL,
  wallet_address TEXT,
  bank_details JSONB,
  status TEXT DEFAULT 'pending',
  auto_approved BOOLEAN DEFAULT false,
  tx_hash TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fp_tx_user ON fp_transactions(user_id, created_at DESC);
CREATE INDEX idx_fp_tx_type ON fp_transactions(type, created_at DESC);
CREATE INDEX idx_network_ancestor ON network_tree(ancestor_id, depth);
CREATE INDEX idx_network_descendant ON network_tree(descendant_id);
CREATE INDEX idx_fp_payouts_status ON fp_payouts(status);
```

### Backend Modul: src/lib/points/forge-points.ts
```
Kern-Funktionen:
  credit(userId, amount, type, desc, sourceUserId?, sourceLevel?)
  debit(userId, amount, type, desc)
  getBalance(userId) → { balance, locked, total, level, streak }
  getNetwork(userId, maxDepth?) → Hierarchie-Baum
  getNetworkStats(userId) → { totalUsers, activeUsers, perLevel[] }
  
Commission-Engine:
  calculateMonthlyCommissions() → Für ALLE Partner
  getCommissionBreakdown(userId, month) → L1-L10 Detail
  
Vesting:
  vestPoints(userId) → Locked Points nach 3 Monaten freigeben
  
Payout:
  requestPayout(userId, amount, method, wallet)
  autoApprovePayouts() → Regeln prüfen, freigeben
  
Gamification:
  checkLevelUp(userId)
  checkAchievements(userId)
  updateStreak(userId)
  
Anti-Fraud:
  checkSelfReferral(referrerId, referralId)
  checkVelocity(ip, country)
  calculateQualityScore(referralId)
  handleChargeback(referralId)
```

### Cron Jobs:
```
Täglich 00:05:    updateAllStreaks() + creditDailyLogins()
Täglich 01:00:    vestLockedPoints() (3-Monats Check)
Monatlich 1. 02:00: calculateMonthlyCommissions()
Monatlich 1. 03:00: creditPerformanceBonuses()
Monatlich 1. 04:00: autoApprovePayouts()
Monatlich 1. 05:00: checkAllLevelUps() + sendReports()
Monatlich 15. 02:00: processPayouts() (Standard-Zyklus)
Wöchentlich Mo 02:00: processGoldPayouts()
```
