---
id: TASK-00116
aliases: [TASK-00116]
type: task
title: Page scopes and shared verbs
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
depends_on: [TASK-00107]
related: [DOC-00003]
---

# Page scopes and shared verbs

The registry knows only inbox, tags and editor. Add the other pages, and make shared actions use the same key everywhere.

## Checklist

- [ ] The registry has scopes for the board, task drawer, goals, knowledge and graph
- [ ] `n` starts a new item and `/` filters, on each page that has that action
- [ ] The Settings shortcuts list shows the new groups
- [ ] Labels for new actions exist in English, Spanish and Brazilian Portuguese
- [ ] A page's keys only fire on that page

## Notes
