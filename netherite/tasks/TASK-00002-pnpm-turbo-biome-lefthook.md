---
id: TASK-00002
aliases: [TASK-00002]
type: task
title: pnpm, turbo, Biome, lefthook
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00001
state: done
depends_on: [TASK-00001]
---

# pnpm, turbo, Biome, lefthook

- [x] pnpm workspaces (`apps/*`, `packages/*`), `.nvmrc` on current Node LTS
- [x] turbo pipeline: `build`, `dev`, `typecheck`, `lint`, `test`
- [x] Biome at the root; lefthook pre-commit runs Biome and typecheck

**Done when:** `pnpm i && pnpm lint && pnpm typecheck` pass on an empty workspace.
