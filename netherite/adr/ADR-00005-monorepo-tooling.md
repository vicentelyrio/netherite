---
id: ADR-00005
aliases: [ADR-00005]
type: adr
title: TypeScript monorepo with pnpm, turbo, Biome, Vitest and changesets
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [tooling, typescript]
---

# TypeScript monorepo with pnpm, turbo, Biome, Vitest and changesets

## Context

v1 used yarn 1 (frozen), ESLint plus Prettier, and CircleCI. A Rust core (as in attic) was considered and rejected: the data set is small, and TypeScript lets the schema, Markdown pipeline and MCP SDK be shared between server and browser. Effect was chosen over assembling separate libraries (zod, Hono, commander, and so on) so errors, dependencies and validation work the same way everywhere.

## Decision

> - **Language:** TypeScript everywhere, `strict`, ESM only. Node: current LTS, pinned in `.nvmrc`.
> - **Package manager:** pnpm workspaces.
> - **Task runner:** turbo.
> - **Lint and format:** Biome (replaces ESLint and Prettier).
> - **Library builds:** tsdown. The app builds with Vite.
> - **One library:** **Effect** (`effect`, `@effect/platform`, `@effect/platform-node`, `@effect/cli`, `@effect/vitest`) for schemas, errors, services, filesystem, processes, HTTP and the CLI ([[ADR-00006]]). Exact versions are pinned.
> - **Tests:** Vitest with `@effect/vitest` for units; Playwright for app end-to-end; golden-file tests for format-preserving edits ([[ADR-00008]]).
> - **Versioning:** changesets. The published package is `netherite` (CLI, server, MCP, bundled UI).
> - **Git hooks:** lefthook (lint and typecheck on pre-commit).
> - **CI:** GitHub Actions replaces CircleCI. It runs lint, typecheck, tests and `netherite lint` on this repo's own `netherite/` folder.

## Consequences

- \+ One language and one schema across UI, server, CLI and MCP.
- \+ Same tooling family as attic, so habits carry over.
- − A single native binary is not the default; `bun build --compile` stays available if needed.
