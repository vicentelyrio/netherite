---
id: TASK-00053
aliases: [TASK-00053]
type: task
title: Docs have no status, so a plan cannot be marked superseded
created: 2026-11-01T23:51:14Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: backlog
decisions: [ADR-00025]
related: [TASK-00025]
---

# Docs have no status, so a plan cannot be marked superseded

Splitting [[DOC-00002]] into items left no way to say "this doc is replaced". ADRs have `superseded`; docs, runbooks and context have only free-form `tags`.

- [ ] Decide how a doc is retired (a `status` field, or `supersedes` on docs) in an ADR
- [ ] Support it in the schema, `set_state`, lint and the freshness rules (retired docs are not tracked)
