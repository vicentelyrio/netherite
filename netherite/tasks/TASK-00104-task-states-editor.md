---
id: TASK-00104
aliases: [TASK-00104]
type: task
title: Task states editor
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: done
position: 46
decisions: [ADR-00030]
depends_on: [TASK-00100, TASK-00101]
---

# Task states editor

Edit `states` from the Workspace tab: names, categories and column order.

## Checklist

- [x] States can be added, renamed, reordered, removed and given a category
- [x] Renaming or removing a state warns with the number of tasks using it, before saving
- [x] The warning says how to find those tasks, since `netherite lint` reports them after the change
- [x] A list the schema refuses, such as a duplicate name, cannot be saved
- [x] Boards show the new columns without a reload
- [x] End-to-end test: rename a state and check the file and the board

## Notes

Awaiting review. States are edited as a draft and saved together, because a half-renamed list should not reach the file. The warning always appears for a rename or removal, even at zero tasks.

- The server also refuses a repeated state name, on write only. A hand-edited file with duplicates still loads, as the schema allows it.
- Renaming does not update tasks. They keep their old state, fail lint and have no board column until updated.
- Saving a block list drops comments inside `states`, as noted on [[TASK-00100]].
