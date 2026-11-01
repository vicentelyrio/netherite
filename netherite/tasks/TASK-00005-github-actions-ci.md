---
id: TASK-00005
aliases: [TASK-00005]
type: task
title: GitHub Actions CI
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00001
state: doing
depends_on: [TASK-00004]
---

# GitHub Actions CI

- [x] Jobs: install, lint, typecheck, test, build
- [x] Cache the pnpm store and turbo
- [x] Matrix: Linux and macOS for everything; Windows for `packages/git` and `core` tests (best-effort support, see [[DOC-00001]])
- [ ] Bundle check: the browser build imports only `Schema` and the HTTP client from `effect` (size budget)
- [x] Placeholder step for `netherite lint` on this repo (enabled in [[TASK-00026]])
