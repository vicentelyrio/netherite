---
id: TASK-00005
aliases: [TASK-00005]
type: task
title: GitHub Actions CI
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00001
state: done
depends_on: [TASK-00004]
---

# GitHub Actions CI

- [x] Jobs: install, lint, typecheck, test, build
- [x] Cache the pnpm store and turbo
- [x] Matrix: Linux and macOS for everything; Windows for `packages/git` and `core` tests (best-effort support, see [[DOC-00001]])
- [x] Bundle check: the browser build imports only `Schema` and the HTTP client from `effect` (size budget)
- [x] Placeholder step for `netherite lint` on this repo (enabled in [[TASK-00026]])

## Progress

Bundle check: `apps/web/scripts/check-bundle.mjs` reads the module report that the Vite build writes (`apps/web/.bundle-report.json`) and compares it with `apps/web/bundle-budget.json`. It fails for a module of `effect` the record does not have, for `effect` growing more than 5%, and for the scripts growing more than 5% gzipped. `pnpm --filter @netherite/web bundle:update` rewrites the record, which is reviewed in the diff. CI runs it after the build. The record starts from what the build uses today: 118 modules of `effect` (446 KB), 603 KB gzipped. Some of those (net, Ndjson, HttpRouter, Stream) are pulled in through the barrel files of `effect/http` and `effect/http-api`, not by the app; trimming them is a separate job.
