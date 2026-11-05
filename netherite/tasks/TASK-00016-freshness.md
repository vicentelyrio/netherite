---
id: TASK-00016
aliases: [TASK-00016]
type: task
title: Freshness
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00003
state: done
depends_on: [TASK-00015, TASK-00010]
---

# Freshness

- [x] Glob matching for `covers:`; baseline from `reviewed_at` or the last commit touching the file
- [x] Count commits since baseline, plus uncommitted changes
- [x] States with configurable thresholds; "not tracked" rules
- [x] Lint warning for drifting and stale items
