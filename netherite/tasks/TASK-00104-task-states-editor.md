---
id: TASK-00104
aliases: [TASK-00104]
type: task
title: Task states editor
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: backlog
decisions: [ADR-00030]
depends_on: [TASK-00100, TASK-00101]
---

# Task states editor

Edit `states` from the Workspace tab: names, categories and column order.

## Checklist

- [ ] States can be added, renamed, reordered, removed and given a category
- [ ] Renaming or removing a state warns with the number of tasks using it, before saving
- [ ] The warning says how to find those tasks, since `netherite lint` reports them after the change
- [ ] A list the schema refuses, such as a duplicate name, cannot be saved
- [ ] Boards show the new columns without a reload
- [ ] End-to-end test: rename a state and check the file and the board

## Notes
