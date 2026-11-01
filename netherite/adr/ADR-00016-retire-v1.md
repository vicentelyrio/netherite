---
id: ADR-00016
aliases: [ADR-00016]
type: adr
title: Retire the v1 stack
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [migration, v1]
---

# Retire the v1 stack

## Context

v1 is an early prototype: Apollo with type-graphql and typedi, a filesystem service reading a fixed home folder, Emotion-based design-system packages, an Electron shell, yarn 1, ESLint and CircleCI. v2 changes the data location, the architecture and the tooling ([[ADR-00002]], [[ADR-00005]], [[ADR-00006]]).

## Decision

Remove, rather than migrate incrementally:

- `services/graphql`, `services/fs`
- `packages/core`, `packages/ds-components`, `packages/ds-tokens`, `packages/ds-assets`, `packages/logger`, `packages/eslint-config-netherite`, `packages/tsconfig`
- `apps/desktop`, `apps/web` (replaced by a new `apps/web`)
- yarn 1, ESLint, Prettier and CircleCI configuration

Kept or carried over:

- The monorepo layout (`apps/`, `packages/`), changesets, `.editorconfig`, README, licence and community files.
- The idea behind `ds-assets` (brand logo) moves into `packages/ui` where still useful.
- Reading Markdown with gray-matter-style frontmatter, now through `core`.

The v1 code stays reachable in git history (and on `main` until v2 merges).

## Consequences

- \+ A clean base that matches the ADRs, without carrying GraphQL and decorators.
- − Nothing from v1 runs during the rewrite. An importer for v1 data is an open question in [[DOC-00001]].
