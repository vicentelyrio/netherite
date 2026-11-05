---
id: TASK-00052
aliases: [TASK-00052]
type: task
title: Scaffold the packages
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00001
state: done
depends_on: [TASK-00003]
---

# Scaffold the packages

- [x] Empty `packages/schema`, `git`, `core`, `server`, `mcp`, `cli`, `tokens`, `ui` and `apps/web` from the package template, with the dependency directions in [[ADR-00006]]
- [x] Lint rule that fails on forbidden imports (for example `core` importing `server`, anything but `ui` importing Mantine)

**Done when:** `pnpm build` and `pnpm typecheck` pass across all empty packages.
