---
id: TASK-00055
aliases: [TASK-00055]
type: task
title: "`create` cannot take an ID, so an import must create items in order"
created: 2026-11-01T23:51:14Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: done
related: [TASK-00025]
---

# `create` cannot take an ID, so an import must create items in order

IDs are the next free number, so reproducing the reserved IDs in [[DOC-00002]] only worked by creating items in numeric order and aborting on a mismatch. That is fine for this split but fragile for any import.

- [x] Decide whether `create` may take an explicit free ID (for imports), or whether import is a separate command: it may, as an optional `id` that must be free, of the type, and written with the workspace's padding
