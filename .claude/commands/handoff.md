---
name: handoff
description: Save session progress and create handoff notes for next session. Use when ending work or switching tasks.
---
Erstelle/aktualisiere die Datei .claude/HANDOFF.md mit:

1. **Diese Session:** Was wurde gemacht? (Liste der Änderungen)
2. **Build Status:** Läuft `npm run build` durch? Wenn nein, welche Fehler?
3. **Nächste Schritte:** Was muss als nächstes passieren? (Top 3)
4. **Geänderte Dateien:** `git diff --name-only HEAD`
5. **Offene Probleme:** Bekannte Bugs oder Blockers

Formatiere als kurze Checkliste. Dann:
```bash
git add .claude/HANDOFF.md
git commit -m "chore: update session handoff notes"
```
