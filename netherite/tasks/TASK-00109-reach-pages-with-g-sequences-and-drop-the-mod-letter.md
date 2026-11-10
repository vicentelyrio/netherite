---
id: TASK-00109
aliases: [TASK-00109]
type: task
title: Reach pages with g sequences and drop the mod+letter defaults
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
depends_on: [TASK-00108]
related: [DOC-00003]
---

# Reach pages with g sequences and drop the mod+letter defaults

Replace the `go.*` defaults with the keys in the keyboard map, which also removes the dead `mod+t` and the keys that override the browser.

## Checklist

- [ ] Every `go.*` action defaults to its `g` sequence from the keyboard map, including `go.settings`
- [ ] The `mod+letter` defaults and their `mod+alt` aliases are gone
- [ ] The sidebar tooltips show the new keys
- [ ] A page shortcut rebound by someone before this change still works
- [ ] An e2e test reaches a page with a `g` sequence, and `g` typed in an input just types

## Notes
