---
name: catchup
description: Rebuild context after /clear. Reads git diff and summarizes what was done and what's left. Use at the start of every new session.
---
Rebuild context after a /clear. Read all files modified on the current branch compared to main.
For each file, understand the changes made. Then summarize:
1. What's been implemented so far
2. What work remains
3. Any known issues from the HANDOFF.md

Changed files on this branch:
$ git diff --name-only main

Also read .claude/HANDOFF.md if it exists.
