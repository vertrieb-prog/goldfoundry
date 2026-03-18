---
name: recover
description: Recover from a crashed or interrupted session. Checks git status, stashes changes, tests build, and resumes or restarts cleanly.
---
Recovery nach Absturz oder Unterbrechung:

1. `git status` → Zeige ungespeicherte Änderungen
2. Wenn uncommitted changes: `git stash` → sichere sie
3. `npm run build` → Funktioniert der Build?
4. Wenn Build OK:
   - `git stash pop` → Änderungen zurückholen
   - Weiterarbeiten wo aufgehört wurde
5. Wenn Build NICHT OK:
   - `git stash drop` → Kaputte Änderungen verwerfen
   - `/catchup` → Kontext neu aufbauen
   - Von vorne anfangen
6. Lies .claude/HANDOFF.md für Kontext der letzten Session
