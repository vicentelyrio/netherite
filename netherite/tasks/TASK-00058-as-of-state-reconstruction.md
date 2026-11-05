---
id: TASK-00058
aliases: [TASK-00058]
type: task
title: As-of state reconstruction
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00009
state: done
depends_on: [TASK-00057]
---

# As-of state reconstruction

- [x] Replay events to the state, pie progress and stale flag of every item at a date
- [x] `GET /graph?asOf=`: items that existed, supersession edges from the accept date
- [x] Same read model through MCP (`get` and `list` with `as_of`)
- [x] Tests: a date before any commit, mid-history, and today equal the live graph
