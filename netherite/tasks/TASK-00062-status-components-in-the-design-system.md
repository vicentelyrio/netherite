---
id: TASK-00062
aliases: [TASK-00062]
type: task
title: Status components in the design system
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00010
state: doing
---

# Status components in the design system

- [x] Tokens: `status-*` (halo, hold grey, done opacity) next to `type-*`
- [x] `StatusGlyph` (pie, halo, hold, done) in sizes 6 to 32, used by cards, graph and Timeline
- [ ] Replace the ad-hoc progress rings and pills on goals, projects, tasks
- [x] Task states map to backlog, in progress, on hold, done through the state category
- [x] Tests for each status and size

## Progress

Tokens: packages/tokens/src/status.ts (statusNames, statusOfCategory, statusGlyph) and --nt-status-* variables. Component: StatusGlyph in packages/ui (pie, halo, hold, done; sizes from 6 to 32; hue is the type). The task state mapping is statusOfCategory(category).

Left: use it where progress rings and pills stand in for status today. The graph (TASK-00063), the board, the drawer and the Timeline (TASK-00065) are where it is needed, so it is replaced there rather than in one sweep.
