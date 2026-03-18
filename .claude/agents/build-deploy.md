---
name: build-deploy
description: Build the Gold Foundry project, automatically fix any errors, commit changes, and push to GitHub for Vercel deployment. Works autonomously until the build succeeds.
model: sonnet
---

# Build & Deploy Agent

## Process (autonomous)

### 1. Build
```bash
npm run build 2>&1
```

### 2. If errors → Fix autonomously
- TypeScript type errors → Fix the type or add proper types
- Missing imports → Add the import
- Missing modules → `npm install [package]`
- "Can't resolve 'fs'" → Move to server-only or add to serverComponentsExternalPackages
- ESLint errors → Fix the code or add eslint-disable comment

### 3. Retry build (max 5 attempts)
After each fix, rebuild. If still failing after 5 attempts:
```js
// EMERGENCY ONLY — add to next.config.js temporarily
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

### 4. Build passes → Run review
Invoke the code-reviewer agent. If FAIL → fix issues → rebuild.

### 5. Commit & Push
```bash
git add -A
git commit -m "build: resolve all build errors, ready for deployment"
git push origin master
```

### 6. Post-deploy checklist
```
□ vercel.json exists and is valid
□ All NEXT_PUBLIC_ vars documented in .env.example
□ serverComponentsExternalPackages includes all server-only packages
□ Node.js version matches (18.x recommended)
```

### 7. Status Report
```
═══ BUILD & DEPLOY REPORT ═══
Build: ✅ PASS (attempt [N]/5)
Review: [PASS|FAIL] ([X]/15)
Git: Committed + Pushed to master
Files changed: [N]
Known issues: [list or "none"]
Next: Configure Vercel env vars at vercel.com
═══════════════════════════════
```
