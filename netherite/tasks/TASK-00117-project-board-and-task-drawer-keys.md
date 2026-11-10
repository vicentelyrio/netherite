---
id: TASK-00117
aliases: [TASK-00117]
type: task
title: Project board and task drawer keys
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: done
decisions: [ADR-00033]
depends_on: [TASK-00116, TASK-00114]
related: [DOC-00003]
---

# Project board and task drawer keys

Work the board without the mouse. Confirm the keys in the keyboard map against the screen first, and update the map if they change.

## Checklist

- [x] `j` `k` move between cards in a column, and `h` `l` between columns
- [x] `shift+h` and `shift+l` move the focused card to the neighbouring column and save it
- [x] `m` opens the move-to-project picker for the focused card
- [x] `t` in the drawer switches between text and code
- [x] Each key shows in the shortcut hints of the control it triggers
- [x] An e2e test moves a card to another column by keyboard and the file changes

## Notes

Only `n` (New task) and `t` (text and code switch) have a control to carry a hint. The card movement keys and `m` have no control on the board, so they appear in the `?` sheet and Settings.
