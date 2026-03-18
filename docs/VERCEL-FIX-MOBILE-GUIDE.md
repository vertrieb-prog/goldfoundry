# GOLD FOUNDRY — VERCEL FIX + MOBILE WORKFLOW

---

## TEIL 1: VERCEL DEPLOYMENT — WARUM ES NICHT GEHT

### Die 7 häufigsten Vercel-Killer bei Next.js + Supabase

Basierend auf der Recherche und dem was ich über das Projekt weiß,
sind das die wahrscheinlichsten Probleme — von häufigst zu seltenst:

### KILLER 1: Fehlende Environment Variables (90% Wahrscheinlichkeit)
Das ist mit ABSTAND der häufigste Grund. Lokal hast du `.env.local`,
aber auf Vercel muss JEDE Variable manuell eingetragen werden.

**Fix:** Geh auf vercel.com → Dein Projekt → Settings → Environment Variables.
Trage ALLE ein:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...          ← ACHTUNG: Nur für "Production", nicht "Preview"
ANTHROPIC_API_KEY=sk-ant-...
METAAPI_TOKEN=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CRYPTOMUS_MERCHANT_ID=...
CRYPTOMUS_API_KEY=...
RESEND_API_KEY=re_...
CRON_SECRET=...                         ← Kannst du selbst generieren: openssl rand -hex 32
```

**Wichtig:** Variablen mit `NEXT_PUBLIC_` MÜSSEN vor dem Build gesetzt sein.
Wenn du sie erst nach dem ersten Deploy hinzufügst, musst du nochmal deployen.

**Test:** Klick auf "Redeploy" (nicht nur git push) nachdem du alle Vars gesetzt hast.

### KILLER 2: TypeScript Build Errors
Vercel ist STRENGER als `npm run dev`. Im Dev-Modus ignoriert Next.js
viele TS-Fehler. Beim Build (`npm run build`) bricht es ab.

**Fix:** Lokal testen:
```bash
npm run build
```
Wenn das lokal auch fehlschlägt → die Fehler fixen.
Wenn es lokal geht aber auf Vercel nicht → meistens fehlende ENV vars (Killer 1).

**Alternativ-Fix (schnell):** In `next.config.js` hinzufügen:
```js
module.exports = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}
```
Das ignoriert TS-Fehler beim Build. NICHT ideal für Production,
aber erstmal zum Deployen.

### KILLER 3: Module die `fs` oder Node-only APIs nutzen
Wenn ein Import in einer Client-Komponente (oder Seite ohne "use server")
ein Node.js Modul nutzt (wie `fs`, `path`, `crypto`), crasht der Build.

**Typischer Fehler:**
```
Module not found: Can't resolve 'fs'
```

**Fix:** Prüfe ob `telegram` (GramJS), `@anthropic-ai/sdk` oder andere
Server-only Pakete in Client-Komponenten importiert werden.
Diese DÜRFEN NUR in:
- `src/lib/*.ts` (Backend)
- `src/app/api/*/route.ts` (API Routes)
- Server Components (ohne "use client")

### KILLER 4: Supabase Integration hängt
Es gibt einen bekannten Bug wo die Supabase-Integration auf Vercel
sich aufhängt ("infinite loading").

**Fix:** NICHT die Vercel Supabase Integration nutzen.
Stattdessen: Environment Variables MANUELL eintragen (Killer 1 Fix).
Das ist sowieso zuverlässiger.

### KILLER 5: Node.js Version
Manche Supabase-Funktionen (besonders Auth) crashen auf Node 20.

**Fix:** In `package.json` hinzufügen:
```json
{ "engines": { "node": "18.x" } }
```
Oder auf Vercel: Settings → General → Node.js Version → 18.x

### KILLER 6: Build Output zu groß
Wenn das Projekt sehr groß ist (viele Seiten, große Dependencies),
kann der Vercel Free Tier das nicht handeln.

**Fix:** Prüfe die Build-Größe. Vercel Free = 100MB Limit.
Falls zu groß: Vercel Pro ($20/Mo) oder Seiten mit Dynamic Rendering statt Static.

### KILLER 7: vercel.json Fehler
Ein falsches Format in vercel.json crasht den Deploy sofort.

**Fix:** Prüfe dass vercel.json valides JSON ist:
```json
{
  "crons": [
    { "path": "/api/cron/master", "schedule": "0 * * * *" }
  ]
}
```

---

### CLAUDE CODE PROMPT FÜR VERCEL-FIX

Wenn du in Claude Code bist, gib diesen Prompt:

```
Analysiere warum das Projekt nicht auf Vercel deployed.

1. Führe `npm run build` aus und zeige mir ALLE Fehler
2. Prüfe ob alle ENV vars in .env.local existieren
3. Prüfe ob next.config.js korrekt ist  
4. Prüfe ob Module wie 'telegram', '@anthropic-ai/sdk' nur server-seitig importiert werden
5. Prüfe ob vercel.json valides JSON ist
6. Fixe alle Fehler und teste nochmal mit `npm run build`
```

---

## TEIL 2: MOBILE WORKFLOW — VOM HANDY AUS ARBEITEN

### OPTION A: GitHub Codespaces (EMPFOHLEN — Einfachste Lösung)

**Was:** Eine komplette VS Code Umgebung im Browser. Läuft auf dem Handy.

**Setup (5 Minuten):**
1. Öffne github.com/PhoeniXDemo/goldfoundry auf dem Handy-Browser
2. Klick "Code" → "Codespaces" → "Create codespace on main"
3. Warte 30-60 Sekunden
4. Du hast jetzt VS Code mit Terminal im Browser
5. Im Terminal: `npm install -g @anthropic-ai/claude-code`
6. Dann: `claude` → Claude Code ist aktiv

**Vorteile:**
- Läuft direkt im Browser (Chrome/Safari)
- 750 Stunden/Monat KOSTENLOS (GitHub Free)
- Alles wird automatisch nach GitHub gesaved
- Claude Code funktioniert im Terminal
- Gleiche Umgebung wie auf dem PC

**Nachteile:**
- Braucht Internet
- Auf kleinem Bildschirm etwas fummelig
- Touch-Keyboard für Terminal nicht ideal → Bluetooth Keyboard hilft

**Pro-Tipp:** Du kannst den Codespace auch vom PC aus starten und dann
auf dem Handy DENSELBEN Codespace öffnen. Der Zustand bleibt erhalten.

### OPTION B: Eigener VPS + Termux/SSH (Poweruser)

**Was:** Du mietest einen kleinen Server (€4/Mo bei Hetzner) und
verbindest dich per SSH vom Handy.

**Setup:**
1. Hetzner Cloud → CX22 Server (€4/Mo, 2 vCPU, 4GB RAM)
2. Ubuntu 24.04 installieren
3. SSH: `apt install nodejs npm git` + Claude Code installieren
4. Git Clone deines Repos auf den Server
5. Vom Handy: Termux (Android) oder Blink/Prompt (iOS)
6. `ssh root@dein-server` → Claude Code → arbeiten

**Vorteile:**
- Volle Kontrolle
- Server läuft 24/7 (auch wenn Handy aus)
- Schneller als Codespaces
- Kannst auch Preview-Server laufen lassen

**Nachteile:**
- Mehr Setup-Aufwand
- Kostet €4/Mo
- Du musst Server managen

### OPTION C: GitHub Mobile App + Claude Chat (Leichtgewichtig)

**Was:** Für schnelle Reviews und Änderungen — kein volles Development.

**Setup:**
1. GitHub Mobile App installieren (iOS/Android)
2. Du kannst: Code ansehen, Issues erstellen, PRs reviewen, kleine Edits
3. Für größere Arbeiten: Claude.ai App (was wir jetzt machen)
4. Claude generiert Code → du kopierst ihn in GitHub Web Editor

**Vorteile:**
- Kein Setup nötig
- Super für Code-Review unterwegs
- Schnell für kleine Fixes

**Nachteile:**
- Kein Terminal
- Kein Claude Code (nur Claude Chat)
- Nicht für großes Development geeignet

---

### MEINE EMPFEHLUNG: OPTION A (Codespaces) + C (für unterwegs)

**Workflow:**
1. Am PC: Normales Development mit Claude Code im Terminal
2. Unterwegs (Handy): GitHub Codespace im Browser öffnen → Claude Code starten
3. Schnelle Reviews: GitHub Mobile App

**Das gibt dir:**
- Überall Zugriff auf dein Projekt
- Claude Code funktioniert überall
- Alles synchronisiert über Git
- Kostenlos (750h/Mo Codespaces)

---

## SOFORT-AKTIONSPLAN FÜR HEUTE

### Schritt 1: Vercel fixen (30 Min)
1. Repo auf PUBLIC stellen (damit Vercel darauf zugreifen kann)
2. vercel.com → Neues Projekt → GitHub Repo importieren
3. ALLE Environment Variables manuell eintragen
4. Framework: Next.js (auto-detect)
5. Build Command: `npm run build` (Standard)
6. Deploy klicken

Falls Build Error:
→ In Claude Code: `npm run build` lokal testen
→ Fehler fixen
→ git push → Vercel baut automatisch neu

### Schritt 2: Codespace einrichten (5 Min)
1. github.com/PhoeniXDemo/goldfoundry
2. Code → Codespaces → Create
3. Terminal öffnen
4. `npm install -g @anthropic-ai/claude-code`
5. `claude` starten
6. Ab jetzt kannst du vom Handy arbeiten

### Schritt 3: Erster Mobile-Test
1. Öffne den Codespace auf dem Handy im Browser
2. Tippe `claude` im Terminal
3. Gib den Prompt: "Zeig mir den aktuellen Projekt-Status und was fehlt"
4. Fertig — du arbeitest mobil
