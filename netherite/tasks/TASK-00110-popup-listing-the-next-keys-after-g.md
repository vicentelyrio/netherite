---
id: TASK-00110
aliases: [TASK-00110]
type: task
title: Popup listing the next keys after g
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
depends_on: [TASK-00108]
related: [DOC-00003]
---

# Popup listing the next keys after g

After the first step of a sequence, a short pause shows which keys can follow, so nobody has to memorise them.

## Checklist

- [ ] After a named pause on the first step, a popup lists each possible next key with its action
- [ ] A quick second key completes the sequence with no popup appearing
- [ ] The popup shows rebound keys, and leaves out cleared ones
- [ ] `Esc` closes it and cancels the sequence, and it never takes focus
- [ ] Its text exists in English, Spanish and Brazilian Portuguese

## Notes
