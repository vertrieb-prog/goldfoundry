---
name: partner-push
description: Generate motivation messages for inactive affiliate partners. Checks partner activity and creates personalized push messages.
---
Erstelle Upline-Push Nachrichten für inaktive Partner.

1. Lade Partner aus crm_leads WHERE status='active' AND plan='partner'
2. Prüfe letzte Aktivität (crm_activities)
3. Für Partner die >7 Tage inaktiv sind:
   - Generiere personalisierte Nachricht mit cachedCall
   - Zeige ihre aktuelle Provision und was sie verpassen
   - Motiviere mit konkreten Zahlen
4. Queue die Nachrichten in crm_email_queue
5. Zeige Summary: X Partner gepusht, Y Nachrichten geplant
