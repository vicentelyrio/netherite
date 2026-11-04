---
id: TASK-00004
aliases: [TASK-00004]
type: task
title: Test setup and fixture workspace
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00001
state: done
depends_on: [TASK-00003]
---

# Test setup and fixture workspace

- [x] Vitest workspace config (done with the root `vitest.config.ts`, which runs every package as a project; `@effect/vitest` is not used). Workspace dependencies are checked with manypkg (`pnpm deps:check`)
- [x] `fixtures/basic`: a small workspace with every item type, links, a supersession chain, an orphan and lint errors
- [x] Helper that creates a temporary git repo from a fixture with a scripted commit history