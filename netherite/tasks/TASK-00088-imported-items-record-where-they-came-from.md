---
id: TASK-00088
aliases: [TASK-00088]
type: task
title: Imported items record where they came from
created: 2026-11-04T11:41:10Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: backlog
decisions: [ADR-00026]
---

# Imported items record where they came from

Schema and lint support for the `source` and `imported_at` fields in [[ADR-00026]], so an import can be repeated without duplicating.

- [ ] Add optional `source` (a path or URL) and `imported_at` (date) to docs, runbooks, context and ADRs
- [ ] Lint: a `source` that is a path inside the repo and no longer exists gets an info note, since the original may have been moved or deleted
- [ ] Show the source in the item view and in the Knowledge preview
- [ ] Tests for the schema, lint and the view
