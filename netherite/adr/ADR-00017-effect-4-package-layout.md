---
id: ADR-00017
aliases: [ADR-00017]
type: adr
title: Build on Effect 4, with its consolidated package layout
status: accepted
date: 2026-11-01
deciders: ["@vicentelyrio"]
tags: [effect, tooling, dependencies]
---

# Build on Effect 4, with its consolidated package layout

## Context

[[ADR-00003]], [[ADR-00005]], [[ADR-00006]], [[ADR-00007]] and [[ADR-00010]] name Effect 3 packages: `@effect/platform`, `@effect/cli` and `JSONSchema.make`. Effect 4 (`effect@4.1.1`, current `latest`) moved those into the core package. `@effect/platform` (0.97) and `@effect/cli` (0.77) are left on the 3.x line and are not used.

## Decision

> The decisions in those ADRs stand. Only the package names change. Netherite uses **Effect 4** and these packages:
>
> | Need | Package and module |
> |---|---|
> | Schema, JSON Schema, Standard Schema | `effect` (`Schema`, `JsonSchema`, `StandardSchema`); JSON Schema from `Schema.toJsonSchemaDocument` |
> | Services, layers, errors, streams, config | `effect` (`Context`, `Layer`, `Stream`, `Config`, `Data`) |
> | File system and paths | `effect` (`FileSystem`, `Path`) with the Node layers from `@effect/platform-node` |
> | Run `git` | `effect/process` (`ChildProcess`, `ChildProcessSpawner`) with `NodeChildProcessSpawner` |
> | HTTP server, API and typed client | `effect/http`, `effect/http-api` (`HttpApi`, `HttpApiBuilder`, `HttpApiClient`) with `NodeHttpServer` |
> | CLI | `effect/cli` |
> | Tests | `@effect/vitest` |
>
> - `effect`, `@effect/platform-node` and `@effect/vitest` are pinned to the same exact version.
> - The browser imports `effect/schema`-level modules and the HTTP client only.
> - Where [[ADR-00003]] and others say `@effect/platform`, `@effect/cli` or `JSONSchema.make`, read the table above.

## Consequences

- \+ Fewer packages to keep in step, and one version for nearly everything.
- − Effect 4 is new (the 4.0 line was in beta and release-candidate until October 2026) and APIs differ from the many 3.x examples online. Check the installed source, not older docs.
- − `HttpApi` and the CLI module live under the same release train as core, so an upgrade moves everything at once.
