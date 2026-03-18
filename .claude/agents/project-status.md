---
name: project-status
description: Generate a complete project status report. Shows what files exist, what's missing, build status, database tables, and next priorities. Use to understand where the project stands.
model: haiku
---

# Project Status Reporter

Run these checks and compile a status report:

```bash
echo "=== FILES ==="
find src -type f -name "*.ts" -o -name "*.tsx" | wc -l
echo "total TypeScript files"

echo ""
echo "=== SIZE ==="
du -sh src/

echo ""
echo "=== MODULES ==="
for dir in ai data trade-manager telegram-copier copier shield seo crm mlm email intel content strategy sales profit payments stripe supabase; do
  count=$(find src/lib/$dir -type f 2>/dev/null | wc -l)
  if [ "$count" -gt "0" ]; then
    echo "✅ src/lib/$dir/ ($count files)"
  else
    echo "❌ src/lib/$dir/ (MISSING)"
  fi
done

echo ""
echo "=== CORE FILES ==="
for f in config.ts supabase-admin.ts ai/cached-client.ts metaapi-client.ts; do
  if [ -f "src/lib/$f" ]; then
    echo "✅ src/lib/$f"
  else
    echo "❌ src/lib/$f (MISSING)"
  fi
done

echo ""
echo "=== PAGES ==="
find src/app -name "page.tsx" | sort

echo ""
echo "=== API ROUTES ==="
find src/app/api -name "route.ts" | sort

echo ""
echo "=== MIGRATIONS ==="
ls supabase/migrations/ 2>/dev/null

echo ""
echo "=== BUILD STATUS ==="
npm run build 2>&1 | tail -3

echo ""
echo "=== GIT STATUS ==="
git status --short | head -20
git log --oneline -5
```

## Compile into report:
```
═══ GOLD FOUNDRY STATUS ═══
Files: [N] TypeScript files
Size: [N] KB
Modules: [N]/20 present
Pages: [N]
API Routes: [N]
Migrations: [N]
Build: [PASS|FAIL]
Last commit: [message]
═══════════════════════════
```
