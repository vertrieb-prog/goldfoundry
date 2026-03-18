---
name: trader-report
description: Generate a complete performance report for a specific trader. Shows win rate, P&L, best/worst trades, strategies, and recommendations.
---
Erstelle einen Trader-Performance-Report.

Parameter: /trader-report [trader-name oder account-id]

1. Lade Trader-Daten aus Supabase (accounts + trades)
2. Berechne: Win Rate, Profit Factor, Max DD, Avg R:R, beste Session, Sharpe Ratio
3. Top 5 beste Trades, Top 5 schlechteste
4. Strategie-Analyse: Welche Setups funktionieren?
5. Empfehlungen basierend auf Intelligence Engine Daten
6. Speichere als reports/trader-[name]-$(date +%Y-%m-%d).md
7. Optional: Generiere eine öffentliche Trader-Profil-Seite
