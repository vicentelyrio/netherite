---
id: TASK-00117
aliases: [TASK-00117]
type: task
title: Project board and task drawer keys
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
depends_on: [TASK-00116, TASK-00114]
related: [DOC-00003]
---

# Project board and task drawer keys

Work the board without the mouse. Confirm the keys in the keyboard map against the screen first, and update the map if they change.

## Checklist

- [ ] `j` `k` move between cards in a column, and `h` `l` between columns
- [ ] `shift+h` and `shift+l` move the focused card to the neighbouring column and save it
- [ ] `m` opens the move-to-project picker for the focused card
- [ ] `t` in the drawer switches between text and code
- [ ] Each key shows in the shortcut hints of the control it triggers
- [ ] An e2e test moves a card to another column by keyboard and the file changes

## Notes
