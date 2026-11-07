---
id: TASK-00094
aliases: [TASK-00094]
type: task
title: Publish @vicentelyrio/netherite to npm for the first time
created: 2026-11-04T20:20:00Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: done
position: 48.5
decisions: [ADR-00027]
---

# Publish @vicentelyrio/netherite to npm for the first time

Get the renamed package onto npm through the release pipeline in [[ADR-00027]]. Nothing publishes from a developer machine.

- [x] Confirm the npm account owns the `@vicentelyrio` scope and has two-factor authentication on (logged in as `vicentelyrio`, two-factor on for login, email verified, `@vicentelyrio/netherite` not taken)
- [x] Choose how the release workflow authenticates: npm trusted publishing (preferred, no stored token) or an `NPM_TOKEN` repository secret; set it up
- [x] `npm pack --dry-run` in `apps/netherite`: the file list holds only `dist`, the README and the LICENSE (30 files, 2.6 MB packed, no source maps)
- [x] Merge `feat/v2` into `main` ([[TASK-00051]]), then merge the "Version Packages" pull request that Changesets opens
- [x] Check the published page: README renders, links work, provenance badge is shown
- [x] In a clean folder run `npx @vicentelyrio/netherite init` and `npx @vicentelyrio/netherite --version`
