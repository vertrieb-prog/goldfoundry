# MetaTrader AI Analytics Portal

KI-gestütztes Trading-Dashboard für Prop-Firm und Quant-Setups.

## Phase 1 — Setup & MetaApi-Anbindung

### Voraussetzungen

- Node.js 18+ und npm
- Ein MetaApi.cloud Account mit provisioniertem MetaTrader-Konto
- (Später) Supabase-Projekt und Anthropic API-Key

### Installation

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen einrichten
cp .env.example .env.local
# → Dann .env.local mit echten Werten füllen (mindestens META_API_TOKEN und META_API_ACCOUNT_ID)

# 3. Next.js Dev-Server starten (optional, für die Landing Page)
npm run dev

# 4. MetaApi-Verbindung testen
npm run fetch-trades

# Optional: Andere Zeiträume abfragen
npx tsx scripts/fetch-trades.ts --hours=48
```

### Projektstruktur

```
metatrader-portal/
├── scripts/
│   └── fetch-trades.ts        # CLI-Skript zum Testen der MetaApi-Verbindung
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Landing Page mit Phasen-Übersicht
│   │   └── globals.css
│   ├── lib/
│   │   ├── config.ts          # Env-Validierung & Config-Loader
│   │   └── metaapi-client.ts  # MetaApi SDK Wrapper
│   ├── types/
│   │   └── trading.ts         # Zentrale TypeScript-Typen
│   └── components/            # (Später) UI-Komponenten
├── .env.example               # Vorlage für Umgebungsvariablen
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

### NPM-Pakete (Phase 1)

| Paket | Zweck |
|---|---|
| `next`, `react`, `react-dom` | Web-Framework |
| `metaapi.cloud-sdk` | MetaTrader-Anbindung über MetaApi |
| `@supabase/supabase-js` | Datenbank (wird in Phase 2 genutzt) |
| `@anthropic-ai/sdk` | Claude AI (wird in Phase 4 genutzt) |
| `tsx` | TypeScript-Skripte direkt ausführen |
| `dotenv` | `.env.local` in Skripten laden |
| `tailwindcss` | Styling |

### Nächste Schritte (Phase 2)

- Supabase-Tabellen für Trades, Accounts und Reports anlegen
- Trade-Daten nach dem Abruf automatisch in Supabase speichern
- API-Route `/api/cron/fetch-trades` für den Cronjob erstellen
