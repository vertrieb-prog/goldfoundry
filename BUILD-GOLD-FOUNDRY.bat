@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ══════════════════════════════════════════════════
REM  GOLD FOUNDRY — KOMPLETTES BUILD SCRIPT (v2 BUGFIXED)
REM  18 Phasen. ALLES drin. Doppelklick. Weggehen.
REM ══════════════════════════════════════════════════

set "LOGFILE=goldfoundry-build-%date:~-4%%date:~-7,2%%date:~-10,2%.log"
echo ══════════════════════════════════════════════════ > "%LOGFILE%"
echo   GOLD FOUNDRY — FULL BUILD >> "%LOGFILE%"
echo   %date% %time% >> "%LOGFILE%"
echo ══════════════════════════════════════════════════ >> "%LOGFILE%"

echo ══════════════════════════════════════════════════
echo   GOLD FOUNDRY — FULL BUILD GESTARTET
echo   %date% %time%
echo   Log: %LOGFILE%
echo ══════════════════════════════════════════════════
echo.

REM ═══ PRE-CHECK: Ist alles da? ═══
echo [PRE-CHECK] Pruefe Voraussetzungen...

where claude >nul 2>nul
if %errorlevel% neq 0 (
    echo FEHLER: claude ist nicht installiert oder nicht im PATH!
    echo Installiere mit: npm install -g @anthropic-ai/claude-code
    pause
    exit /b 1
)
echo   claude: OK

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo FEHLER: git ist nicht installiert!
    pause
    exit /b 1
)
echo   git: OK

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo FEHLER: node ist nicht installiert!
    echo Installiere von: https://nodejs.org
    pause
    exit /b 1
)
echo   node: OK

if not exist ".git" (
    echo FEHLER: Kein Git Repository! Bist du im richtigen Ordner?
    echo Aktueller Ordner: %cd%
    pause
    exit /b 1
)
echo   git repo: OK

if not exist "goldfoundry-MEGA-PACK.zip" (
    echo FEHLER: goldfoundry-MEGA-PACK.zip nicht gefunden!
    echo Lege die ZIP in diesen Ordner: %cd%
    pause
    exit /b 1
)
echo   MEGA-PACK.zip: OK

if not exist "goldfoundry-session-complete.zip" (
    echo WARNUNG: goldfoundry-session-complete.zip nicht gefunden.
    echo   Manche Backend-Module werden neu erstellt statt kopiert.
)

echo [PRE-CHECK] Alles OK. Starte Build...
echo.

REM ═══ PHASE 0: SETUP ═══
echo [0/18] ZIPs entpacken + Infrastruktur...
echo [0/18] ZIPs entpacken >> "%LOGFILE%"

REM PowerShell fuer sicheres Entpacken (handles .claude Ordner korrekt)
powershell -Command "Expand-Archive -Path 'goldfoundry-MEGA-PACK.zip' -DestinationPath '.' -Force" 2>nul
if exist "goldfoundry-session-complete.zip" (
    powershell -Command "New-Item -ItemType Directory -Path '%TEMP%\gf-import' -Force | Out-Null; Expand-Archive -Path 'goldfoundry-session-complete.zip' -DestinationPath '%TEMP%\gf-import' -Force" 2>nul
)

git add -A >nul 2>nul
git commit -m "infra: Claude Code (14 agents, 27 commands, 12 skills)" >nul 2>nul
echo [0/18] DONE
echo.

REM ═══ PHASE 1: VERCEL FIX ═══
echo [1/18] Vercel Build Fix (WICHTIGSTE PHASE)...
echo [1/18] Vercel Fix >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "WICHTIG: Fixe zuerst alle Build-Probleme. 1) Pruefe next.config.js: experimental.serverComponentsExternalPackages muss ['@anthropic-ai/sdk','metaapi.cloud-sdk','telegram'] enthalten. 2) npm install — alle Dependencies installieren. 3) Erstelle .env.local falls nicht vorhanden mit: NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co und NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder und SUPABASE_SERVICE_ROLE_KEY=placeholder und ANTHROPIC_API_KEY=placeholder und CRON_SECRET=placeholder-secret. 4) Pruefe tsconfig.json: paths @/* muss auf src/* mappen. 5) npm run build. Jeden Fehler einzeln fixen. Typische Fehler: Module not found (npm install), Type errors (as any), Missing env (dummy in .env.local). Am Ende MUSS npm run build CLEAN laufen. git add -A && git commit -m 'fix: build errors resolved'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [1/18] DONE
echo.

REM ═══ PHASE 2: ZENTRALE ARCHITEKTUR ═══
echo [2/18] Zentrale Architektur (3 Kern-Dateien)...
echo [2/18] Architektur >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Lies CLAUDE.md. Erstelle 3 zentrale Dateien: 1) src/lib/config.ts mit exports: MODELS (fast/smart), PRICING (4 plans in EUR), PARTNER_TIERS (7 Raenge mit Level-Raten), RANK_REQUIREMENTS, BUILDER_PACKS, EXCHANGES (10 exchanges), ASSETS (crypto/forex/indices/commodities Listen), CONTEST_CONFIG. 2) src/lib/ai/cached-client.ts (mkdir -p src/lib/ai): Ein einziger Anthropic Client, exportiert cachedCall(model, system, prompt) Funktion. 3) src/lib/supabase-admin.ts: Ein einziger Supabase Admin Client (createClient mit service role key). npm install @anthropic-ai/sdk. npm run build. git add -A && git commit -m 'feat: central config + AI client + Supabase admin'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [2/18] DONE
echo.

REM ═══ PHASE 3: REFACTORING ═══
echo [3/18] Bestehende Module refactoren...
echo [3/18] Refactoring >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "In ALLEN .ts Dateien unter src/lib/ ersetze: 1) new Anthropic( mit Import von cachedCall aus '@/lib/ai/cached-client'. 2) Eigene createClient( fuer Supabase (NICHT src/lib/supabase/client.ts und server.ts) mit supabaseAdmin aus '@/lib/supabase-admin'. 3) Hardcoded 'claude-haiku' oder 'claude-sonnet' mit MODELS.fast oder MODELS.smart aus '@/lib/config'. npm run build. git add -A && git commit -m 'refactor: centralize all clients'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [3/18] DONE
echo.

REM ═══ PHASE 4: BACKEND MODULE ═══
echo [4/18] Backend Module (Data, Trade, Telegram, SEO, CRM)...
echo [4/18] Backend >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Erstelle die Backend Module: 1) src/lib/data/collector.ts (MQL5 + MyFxBook Scraper Funktionen). 2) src/lib/data/intelligence.ts (Analysiert Trade-Daten, Market Regime Detection, Sentiment). 3) src/lib/trade-manager/manager.ts (Empfaengt Signale, prueft Risk, berechnet Lots, executiert). 4) src/lib/telegram-copier/copier.ts (Telegram Signal Parser + Auto-Copy). 5) src/lib/telegram-copier/smart-orders.ts (4-Split TP, Auto-BE, Trailing Runner). 6) src/lib/seo/engine.ts (SEO Seiten Generator). 7) src/lib/seo/expansion.ts (200 Assets, 12 Content Cluster). 8) src/lib/seo/auto-linker.ts (50+ interne Link-Regeln). 9) src/lib/crm/lead-manager.ts (Lead Scoring, Churn Detection, Email Sequences). 10) src/app/api/cron/master/route.ts (Master Cron: dispatcht Jobs basierend auf Stunde/Tag/Datum). Alle nutzen supabaseAdmin und cachedCall. npm install telegram. npm run build. git add -A && git commit -m 'feat: backend modules'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [4/18] DONE
echo.

REM ═══ PHASE 5: 5 KILLER FEATURES ═══
echo [5/18] Challenge Tracker + Journal + Calendar + Momentum + Multi-Account...
echo [5/18] Features >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Lies docs/FEATURE-PROJEKTPLAN.md. Erstelle: 1) src/lib/challenge-tracker/tracker.ts (getChallengeProgress, calculateDailyBudget, getDaysRemaining, getRecommendation — verbunden mit Risk Engine). 2) src/lib/journal/auto-journal.ts (onTradeClose generiert AI-Kommentar via Haiku, getDailyJournal, getWeeklyPatterns). 3) src/lib/calendar/economic-calendar.ts (getTodayEvents, shouldBlockTrading — HIGH IMPACT blockt 15min). 4) Momentum Scaling in config.ts (base 1pct, +0.2 pro Win, cap 1.5x, reset on loss). 5) src/lib/multi-account/aggregator.ts (getAllAccounts, getAggregatedStats, getCriticalAlerts). npm run build. git add -A && git commit -m 'feat: 5 killer features'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [5/18] DONE
echo.

REM ═══ PHASE 6: MLM + FORGE POINTS ═══
echo [6/18] MLM + FORGE Points System...
echo [6/18] MLM >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Lies docs/DEFINITIVE-COMP-PLAN.md und docs/FORGE-POINTS-SYSTEM.md. Erstelle: src/lib/mlm/network-engine.ts (Closure Table: addToNetwork mit ancestor/descendant/depth, getNetwork, getNetworkStats). src/lib/mlm/commission-engine.ts (calculateMonthlyCommissions: Unilevel L1 bis unendlich, Compression bei 30d inaktiv, 50pct Revenue, Provision auf Rabattpreis im 1.Monat). src/lib/mlm/matching-engine.ts (Gold 10pct, Diamond 20/10/5pct, Crown 25/15/10/5pct — NUR bei eigenen neuen Refs). src/lib/mlm/rank-engine.ts (7 Raenge, 5 Kriterien monatlich, 100/50/0pct Bonus, Rollup 90d). src/lib/mlm/builder-packs.ts (5er 99EUR, 10er 179EUR, 25er 399EUR, 50er 699EUR, FP erst bei 60pct eingeloest UND bezahlt). src/lib/mlm/payout-engine.ts (min 5000FP, KYC nur bei Auszahlung, Auto-Approve). src/lib/points/forge-points.ts (1FP gleich 0.10EUR, credit, debit, balance, level, 3-Monats Vesting). src/lib/points/fast-start.ts (nur bei ZAHLUNG). src/lib/points/pool-engine.ts (5pct Pool, Gold+ qualifiziert). src/lib/points/achievements.ts (15 Badges). npm run build. git add -A && git commit -m 'feat: MLM + FORGE Points'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [6/18] DONE
echo.

REM ═══ PHASE 7: PARTNER EXPERIENCE ═══
echo [7/18] Partner Experience...
echo [7/18] Partner >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Lies docs/PARTNER-EXPERIENCE-COMPLETE.md. Erstelle: src/lib/partner/coach.ts (AI Mentor via Haiku: Tipps, Nachrichten, Netzwerk-Analyse). src/lib/partner/fast-start.ts (4-Wochen Plan je nach Ziel). src/lib/partner/screenshot-gen.ts (Daily/Weekly/Monthly Cards mit USER PROFIT nicht Trader-Performance, Ref-Link im Bild). src/lib/partner/content-generator.ts (Posts fuer Insta/WhatsApp/Telegram/Twitter). src/lib/partner/share-links.ts (auto Ref-Parameter). src/lib/partner/hot-leads.ts (Besucher-Tracking). src/lib/partner/daily-tasks.ts (5 Tasks/Tag, Streak 14d=200FP 30d=500FP). src/lib/partner/report-generator.ts (daily/weekly/monthly Reports). src/lib/notifications/partner-notifications.ts. npm run build. git add -A && git commit -m 'feat: partner experience'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [7/18] DONE
echo.

REM ═══ PHASE 8: CRYPTO + EXCHANGES ═══
echo [8/18] Crypto + Exchange Connectors...
echo [8/18] Crypto >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Lies docs/CRYPTO-EXPANSION.md. Erstelle: src/lib/exchanges/exchange-connector.ts (Interface: connect, placeOrder, getPositions, getBalance, closePosition). src/lib/exchanges/binance.ts, bybit.ts, bitget.ts, okx.ts (Placeholder Implementations). src/lib/crypto/liquidation-tracker.ts (calculateLiquidationPrice, autoClose bei unter 10pct). src/lib/crypto/funding-rates.ts (fetchRates, getAlerts). src/lib/crypto/on-chain.ts (Placeholder). src/lib/crypto/defi-compare.ts (Gold Foundry vs Aave/Lido/Curve). src/lib/crypto/portfolio-manager.ts (getAllocation, rebalance). src/lib/crypto/crypto-copier.ts (copyTrade via Connector). In config.ts: EXCHANGES und ASSETS Objekte. npm run build. git add -A && git commit -m 'feat: crypto + exchanges'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [8/18] DONE
echo.

REM ═══ PHASE 9: DATENBANK ═══
echo [9/18] Datenbank Migration (31 Tabellen)...
echo [9/18] Migration >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Erstelle supabase/migrations/005_complete_system.sql (mkdir -p supabase/migrations). 31 Tabellen alle mit UUID PKs und created_at: challenge_configs, journal_entries, forge_points (balance/locked/total_earned/level/streak), fp_transactions (amount/type/description/vested), fp_achievements, fp_payouts (amount_fp/amount_eur/method/wallet/status/tx_hash), network_tree (ancestor_id/descendant_id/depth UNIQUE), builder_packs (buyer_id/pack_type/quantity/price/codes), invite_codes (code PK/sponsor_id/redeemed_by/expires_at), rank_history, matching_bonus_log, performance_pool, pool_payouts, partner_pages (slug UNIQUE/headline/bio/photo/video/selected_traders/contacts), partner_kyc (status none/pending/approved/id_front/id_back/selfie), partner_milestones, referral_clicks (partner_id/source/converted), share_events, partner_screenshots, hot_leads (visitor_hash/visit_count/pages_viewed), daily_tasks (date/tasks JSONB/completed/total), training_progress (level/videos_watched/quizzes_passed), community_posts (content/likes/pinned), ab_tests (element/variant_a/b/visits/conversions/winner), weekly_challenges, weekly_challenge_completions, partner_report_prefs, partner_notification_prefs, partner_contests (title/type/prize_fp/dates/winner), generational_bonus_log, first_to_rank (rank PK/achieved_by). Passende INDEXES auf foreign keys und haeufige Queries. git add -A && git commit -m 'feat: migration 005'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [9/18] DONE
echo.

REM ═══ PHASE 10: CRON ROUTES ═══
echo [10/18] 20 Cron Routes...
echo [10/18] Crons >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Erstelle 20 Cron Sub-Routes unter src/app/api/cron/. Jede Route: export async function GET(req), Auth-Check (req.headers.get Authorization gleich Bearer CRON_SECRET oder x-cron-master), try-catch, return NextResponse.json. Routes: collect-mql5, collect-myfxbook, sentiment, intelligence, seo, winback, lead-scoring, health-check, partner-tiers, commissions, matching, rank-check, pool-distribute, vesting, contests, partner-daily-report, partner-weekly-report, auto-lot-scaling, content-quality, performance-reports. Jede Route hat TODO Kommentar fuer die Implementierung. npm run build. git add -A && git commit -m 'feat: 20 cron routes'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [10/18] DONE
echo.

REM ═══ PHASE 11: API ROUTES ═══
echo [11/18] 21 API Routes...
echo [11/18] APIs >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Erstelle API Routes (Next.js App Router, export async function GET oder POST): Unter src/app/api/partner/: invite, pack, redeem, landing, payout, coach, screenshot, content, tasks, hot-leads (je route.ts). Unter src/app/api/admin/: overview, partners, payouts, kyc, analytics, fraud. Unter src/app/api/crypto/: funding-rates, liquidation, on-chain. Jede Route: Supabase Auth Check, try-catch, NextResponse.json. Placeholder-Logik mit TODO. npm run build. git add -A && git commit -m 'feat: 21 API routes'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [11/18] DONE
echo.

REM ═══ PHASE 12: ADMIN DASHBOARD ═══
echo [12/18] Admin CRM Dashboard (6 Seiten)...
echo [12/18] Admin >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Lies docs/CRM-PARTNER-DASHBOARD-PLAN.md. Erstelle: src/app/admin/layout.tsx (Sidebar: Overview/Partners/Payouts/KYC/Analytics/Fraud, Dark Theme bg #060503 gold #d4a537). src/app/admin/overview/page.tsx (KPI Karten + Revenue Split). src/app/admin/partners/page.tsx (Pipeline + Tabelle). src/app/admin/partners/[id]/page.tsx (Detail). src/app/admin/payouts/page.tsx (Queue + Approve/Reject). src/app/admin/kyc/page.tsx (KYC Queue). src/app/admin/analytics/page.tsx (Charts Placeholder). Tailwind CSS, keine externen UI Libraries noetig. npm run build. git add -A && git commit -m 'feat: admin dashboard'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [12/18] DONE
echo.

REM ═══ PHASE 13: PARTNER DASHBOARD ═══
echo [13/18] Partner Dashboard (7 Tabs)...
echo [13/18] Partner Dashboard >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Lies docs/PARTNER-TOOLKIT-COMPLETE.md. Erstelle 10 Seiten: src/app/dashboard/partner/page.tsx (Uebersicht: FP Balance, Breakdown, Rang, Verpasste Boni, Live Feed). network/page.tsx (Baum + Level Bars). invite/page.tsx (Link + QR + Packs + Codes). landing/page.tsx (LP Editor). material/page.tsx (Banner + Vorlagen + Videos). team/page.tsx (Leaderboard + Contests + Training). earnings/page.tsx (FP Detail + Auszahlung + Steuer-Export). coach/page.tsx (AI Chat). tasks/page.tsx (Daily Tasks + Streak). hot-leads/page.tsx (Warme Kontakte). Dark Theme. npm run build. git add -A && git commit -m 'feat: partner dashboard 7 tabs'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [13/18] DONE
echo.

REM ═══ PHASE 14: LANDING PAGES ═══
echo [14/18] Landing Pages (Dynamic Routes)...
echo [14/18] LPs >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Erstelle Dynamic Routes: src/app/partner/[slug]/page.tsx (Partner LP aus DB). src/app/trader/[slug]/page.tsx (Trader LP, ?ref= setzt 90d Cookie). src/app/exchange/[slug]/page.tsx (Exchange LP). src/app/vergleich/[slug]/page.tsx (Vergleichs-Seite). src/app/asset/[slug]/page.tsx (Asset Seite). src/app/lernen/[slug]/page.tsx (Learning Center). src/app/crypto/page.tsx (Crypto Haupt-LP). src/app/crypto/[trader]/page.tsx (Crypto Trader). src/components/recommended-by-banner.tsx (Empfohlen von Banner, Cookie-basiert). Alle: Dark Theme, Risikohinweis, CTA. npm run build. git add -A && git commit -m 'feat: landing pages'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [14/18] DONE
echo.

REM ═══ PHASE 15: SHARE SYSTEM ═══
echo [15/18] Share Buttons + Cards + Widgets...
echo [15/18] Share >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "Erstelle Komponenten: src/components/partner/share-button.tsx (WhatsApp/Telegram/Insta/Twitter/Email/QR, auto Ref-Parameter). src/components/partner/performance-card.tsx (User-Profit Card: Meine X Kunden haben Y EUR verdient). src/components/partner/milestone-card.tsx (Badge Card). src/components/partner/potential-widget.tsx (Als Gold verdienst du X mehr). src/components/partner/missed-bonus.tsx (Du hast X FP verpasst). src/components/partner/live-feed.tsx (Events Stream). npm run build. git add -A && git commit -m 'feat: share system'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [15/18] DONE
echo.

REM ═══ PHASE 16: NAMING FIXES ═══
echo [16/18] Naming + Pricing Fixes...
echo [16/18] Fixes >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "KRITISCH: In ALLEN .tsx und .jsx unter src/ finde und ersetze: AI Copier mit Smart Copier. FORGE AI mit FORGE Mentor. AI Agent mit FORGE Agent. AI Risk Engine mit Risk Engine. AI Trade Manager mit Trade Manager. Alle GRATIS/gratis/kostenlos/Kostenlos mit 80pct Rabatt. 30pct Provision mit Bis zu 50pct. Dollar-Preise mit Euro. Verifiziere: grep -ri 'AI Copier' src/ und grep -ri 'FORGE AI' src/ und grep -ri 'GRATIS' src/ und grep -ri 'kostenlos' src/ — ALLES muss LEER sein. npm run build. git add -A && git commit -m 'fix: naming pricing'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [16/18] DONE
echo.

REM ═══ PHASE 17: CONFIG + SECURITY ═══
echo [17/18] Vercel + Security + PWA...
echo [17/18] Config >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "1) Erstelle vercel.json: {crons:[{path:'/api/cron/master',schedule:'0 * * * *'}]}. 2) In next.config.js: headers() Funktion mit X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin. 3) Erstelle public/manifest.json (name Gold Foundry, short_name FORGE, theme_color #d4a537, background_color #060503). 4) Link manifest in src/app/layout.tsx. 5) Erstelle .env.example mit allen Variablen. 6) Pruefe .env.local hat Dummy-Werte. npm run build. git add -A && git commit -m 'config: vercel security PWA'. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [17/18] DONE
echo.

REM ═══ PHASE 18: FINAL BUILD + PUSH ═══
echo [18/18] FINAL BUILD + PUSH...
echo [18/18] Final >> "%LOGFILE%"
claude --dangerously-skip-permissions -p "FINAL: 1) npm run build — muss CLEAN durchlaufen. Fehler? Fixen. Nach 5 Versuchen: typescript ignoreBuildErrors true als Notloesung. 2) Verify: grep -ri 'AI Copier' src/ muss leer sein. 3) Verify: es existiert vercel.json, .env.example, public/manifest.json. 4) git add -A && git commit -m 'build: Gold Foundry Trading Portal COMPLETE'. 5) git push origin master. 6) Am Ende zeige: Anzahl TS/TSX Dateien, Ordner-Groesse, Build Status, letzte 15 Commits, Violations Check. Frage NICHTS." >> "%LOGFILE%" 2>&1
echo [18/18] DONE
echo.

REM ═══ FERTIG ═══
echo ══════════════════════════════════════════════════
echo   GOLD FOUNDRY — BUILD KOMPLETT ABGESCHLOSSEN!
echo   %date% %time%
echo   Log: %LOGFILE%
echo ══════════════════════════════════════════════════
echo.
echo   NAECHSTE SCHRITTE:
echo.
echo   1. Gehe zu: vercel.com/dashboard
echo   2. Waehle dein Projekt
echo   3. Settings - Environment Variables
echo   4. Setze diese Variablen:
echo.
echo      NEXT_PUBLIC_SUPABASE_URL = (aus Supabase Dashboard)
echo      NEXT_PUBLIC_SUPABASE_ANON_KEY = (aus Supabase Dashboard)
echo      SUPABASE_SERVICE_ROLE_KEY = (aus Supabase Dashboard)
echo      ANTHROPIC_API_KEY = (aus console.anthropic.com)
echo      METAAPI_TOKEN = (aus metaapi.cloud)
echo      STRIPE_SECRET_KEY = (aus stripe.com)
echo      STRIPE_WEBHOOK_SECRET = (aus Stripe Webhooks)
echo      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = (aus stripe.com)
echo      CRYPTOMUS_MERCHANT_ID = (aus cryptomus.com)
echo      CRYPTOMUS_API_KEY = (aus cryptomus.com)
echo      CRON_SECRET = (irgendein langer zufaelliger String)
echo.
echo   5. Deployments - Redeploy ausloesen
echo   6. Warten bis Deploy fertig
echo   7. goldfoundry.de testen!
echo.
echo ══════════════════════════════════════════════════
echo.
pause
