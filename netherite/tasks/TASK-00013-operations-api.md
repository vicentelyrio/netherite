---
id: TASK-00013
aliases: [TASK-00013]
type: task
title: Operations API
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00002
state: done
depends_on: [TASK-00009, TASK-00012]
---

# Operations API

- [x] `createItem`, `updateFields`, `setState`, `toggleCheck`, `link`/`unlink`, `deleteItem`, `markReviewed`, `renumber`
- [x] Validate before every write; failures are tagged errors (`ValidationError`, `ConflictError`, `NotFound`)
- [x] Optimistic concurrency with content hashes; atomic temp-file-and-rename writes
- [x] Supersession updates both ADRs; `deleteItem` refuses while linked unless forced
- [x] `renumber` rewrites links in frontmatter and bodies
