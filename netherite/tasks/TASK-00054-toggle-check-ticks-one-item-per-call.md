---
id: TASK-00054
aliases: [TASK-00054]
type: task
title: "`toggle_check` ticks one item per call"
created: 2026-11-01T23:51:14Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: done
related: [TASK-00025]
---

# `toggle_check` ticks one item per call

Marking 26 finished tasks took about 90 `toggle_check` calls. An agent closing a task wants to tick several items, or all of them, at once.

- [x] Accept a list of items, or `all: true`, in one write with one hash check
- [x] Update the `netherite-task` skill to use it
