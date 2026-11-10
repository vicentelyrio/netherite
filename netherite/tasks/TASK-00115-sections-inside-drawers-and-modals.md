---
id: TASK-00115
aliases: [TASK-00115]
type: task
title: Sections inside drawers and modals
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
depends_on: [TASK-00112]
related: [DOC-00003]
---

# Sections inside drawers and modals

An open overlay is its own small page for the keyboard.

## Checklist

- [ ] The task drawer declares its sections, and `.` and `,` stay inside them
- [ ] `;` does nothing while a drawer or modal is open
- [ ] Closing the drawer returns focus to the card that opened it
- [ ] The search palette keeps its own keys
- [ ] An e2e test goes through the drawer's sections and closes it back to the card

## Notes
