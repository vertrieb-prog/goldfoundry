---
name: morning-report
description: Generate the daily Gold Foundry morning briefing. Shows gold price, market sentiment, open trades, performance, upcoming events, and system health.
---
Erstelle den täglichen Gold Foundry Morning Report:

1. Lies den aktuellen GoldIntelligence aus Supabase:
   `SELECT data FROM user_data WHERE user_id='00000000-0000-0000-0000-000000000000' AND category='gold_intelligence'`

2. Erstelle einen Report mit:
   - Gold Preis + 24h Change
   - Markt-Regime (Trending/Ranging/Volatile)
   - Sentiment (Long/Short %)
   - Top Trader Performance heute
   - Anstehende Events (FOMC/NFP/CPI)
   - System Health (MetaApi Status, offene Trades, Errors)
   - CRM: Neue Signups, Churn Risk Alerts

3. Formatiere als übersichtliche Konsolen-Ausgabe
4. Speichere als `reports/morning-$(date +%Y-%m-%d).md`
