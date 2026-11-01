---
id: TASK-00015
aliases: [TASK-00015]
type: task
title: "`packages/git` read-only adapter"
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00003
state: done
depends_on: [TASK-00004]
---

# `packages/git` read-only adapter

- [x] `Git` service over `effect/process` `ChildProcess`: no shell, argument arrays, timeouts; tagged errors
- [x] `status --porcelain=v2`, `log` with name-only and numstat, `rev-parse`, `config user.*`
- [x] Cache keyed by `HEAD` and index modification time
- [x] Graceful degrade without git, outside a repo, or in a shallow clone
- [x] A test that the adapter exposes no write commands
