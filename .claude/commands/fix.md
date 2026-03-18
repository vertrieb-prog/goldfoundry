---
name: fix
description: Fix all naming violations (AI mentions, GRATIS, wrong prices, missing disclaimers).
---
Search all .tsx and .jsx files for naming violations and fix them:
1. "AI Copier" → "Smart Copier"
2. "FORGE AI" → "FORGE Mentor"  
3. "AI Agent" → "FORGE Agent"
4. "GRATIS" / "kostenlos" → "80% Rabatt"
5. "30% Provision" → "Bis zu 50% Provision"
6. "$29" → "€29"
7. Add Risikohinweis to any page that's missing one
Then run `npm run build` to verify.
