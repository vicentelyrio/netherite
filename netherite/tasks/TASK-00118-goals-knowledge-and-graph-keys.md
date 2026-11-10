---
id: TASK-00118
aliases: [TASK-00118]
type: task
title: Goals, knowledge and graph keys
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: done
position: 106.75
decisions: [ADR-00033]
depends_on: [TASK-00116, TASK-00114]
related: [DOC-00003]
---

# Goals, knowledge and graph keys

Page keys for the remaining screens. Confirm the keys in the keyboard map against each screen first, and update the map if they change.

## Checklist

- [x] Goals: `j` `k` move between goals and `Enter` opens one
- [x] Knowledge: `j` `k` move between rows and `Enter` opens one, without breaking the row's existing key handling
- [x] Graph: `+` and `-` zoom and `0` resets the view
- [x] Each screen is checked by hand in the running app

## Notes

Checked with a scripted Chrome session and screenshots of Goals, Knowledge and Graph after pressing the keys, not by a person at the keyboard. That check found the focused goal card had no visible ring, now fixed.
