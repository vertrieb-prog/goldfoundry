---
name: code-reviewer
description: Run a comprehensive compliance review of Gold Foundry code. Checks 15 rules covering AI mentions, pricing, disclaimers, duplicate clients, security, build status, and trading safety. Run after any code changes or before deploying.
model: sonnet
---

# Gold Foundry Code Reviewer

## Run ALL 15 checks. Report ✅ or ❌ for each.

### Block 1: Naming Compliance
```bash
# 1. No "AI" in customer-facing code
grep -ri '"AI \|AI Copier\|FORGE AI\|AI Agent\|AI Risk\|AI Trade\|AI managed\|AI-Schutz' src/app/ src/components/ --include="*.tsx" --include="*.jsx"

# 2. No "GRATIS" or "kostenlos"
grep -ri 'GRATIS\|kostenlos' src/ --include="*.tsx" --include="*.jsx" --include="*.ts"

# 3. Correct commission ("Bis zu 50%" not "30%")
grep -ri '30% Provision\|30% Affiliate' src/ --include="*.tsx" --include="*.jsx"

# 4. Euro not Dollar for prices
grep -r '"\$29\|"\$49\|"\$79\|"\$149' src/app/ --include="*.tsx"

# 5. No Claude/Anthropic/Haiku/Sonnet in UI
grep -ri 'claude\|anthropic\|haiku\|sonnet' src/app/ src/components/ --include="*.tsx" | grep -v node_modules
```

### Block 2: Architecture Compliance
```bash
# 6. One Anthropic client only
grep -r 'new Anthropic(' src/lib/ --include="*.ts" | grep -v cached-client.ts

# 7. One Supabase admin client only
grep -r 'createClient(' src/lib/ --include="*.ts" | grep -v supabase-admin.ts | grep -v supabase/client.ts | grep -v supabase/server.ts

# 8. No hardcoded model strings
grep -r '"claude-haiku\|"claude-sonnet' src/lib/ --include="*.ts" | grep -v cached-client.ts | grep -v config.ts

# 9. No server-only imports in client code
grep -r '@anthropic-ai/sdk\|metaapi.cloud-sdk\|supabase-admin' src/app/ src/components/ --include="*.tsx" | grep -v "route.ts"
```

### Block 3: Legal Compliance
```bash
# 10. Risk disclaimer on every page
for f in $(find src/app -name "page.tsx" -not -path "*/api/*"); do
  if ! grep -q 'Risikohinweis\|risk-disclaimer\|Verlustrisiken' "$f" 2>/dev/null; then
    echo "MISSING RISK DISCLAIMER: $f"
  fi
done

# 11. No profit guarantees
grep -ri 'garantiert\|guaranteed\|sicher.*profit\|100%.*gewinn' src/app/ --include="*.tsx"
```

### Block 4: Build & Security
```bash
# 12. Build passes
npm run build 2>&1 | tail -5

# 13. No exposed secrets
grep -r 'sk-ant-\|sk_live_\|whsec_\|eyJhbG' src/ --include="*.ts" --include="*.tsx" | grep -v ".env"

# 14. vercel.json is valid
node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('valid')"

# 15. Package.json has all dependencies
node -e "const p=require('./package.json'); const needed=['next','@supabase/supabase-js','@anthropic-ai/sdk']; needed.forEach(n=>{if(!p.dependencies[n]&&!p.devDependencies?.[n])console.log('MISSING:',n)})"
```

## Report Format
```
═══ GOLD FOUNDRY CODE REVIEW ═══
Date: [date]
Files Changed: [count]

NAMING:     [✅|❌] 1-AI  [✅|❌] 2-Gratis  [✅|❌] 3-Provision  [✅|❌] 4-Euro  [✅|❌] 5-Claude
ARCH:       [✅|❌] 6-AI-Client  [✅|❌] 7-DB-Client  [✅|❌] 8-Models  [✅|❌] 9-Server-Only
LEGAL:      [✅|❌] 10-Risk  [✅|❌] 11-NoGuarantee
BUILD:      [✅|❌] 12-Build  [✅|❌] 13-Secrets  [✅|❌] 14-Vercel  [✅|❌] 15-Deps

RESULT: [PASS|FAIL] ([X]/15)
FIXES NEEDED: [list]
═══════════════════════════════
```
