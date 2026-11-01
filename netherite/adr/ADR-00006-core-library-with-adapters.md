---
id: ADR-00006
aliases: [ADR-00006]
type: adr
title: One core library, with server, CLI, MCP and desktop as thin adapters
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [architecture, packages]
---

# One core library, with server, CLI, MCP and desktop as thin adapters

## Context

People reach Netherite through the app; agents through MCP and skills; both through the CLI. All of them must see the same index and apply the same rules when writing.

## Decision

Packages:

```
packages/
  schema   zod schemas, JSON Schema export, ID rules            (no deps)
  core     load workspace, parse, index, graph, lint,
           freshness, and *operations* (all writes)            ← schema, git
  git      read-only git adapter (spawns `git`)                 (no internal deps)
  server   Hono HTTP API, SSE events, file watcher, serves UI   ← core
  mcp      MCP server (stdio and streamable HTTP)               ← core
  cli      `netherite` binary: init, serve, mcp, new, lint,
           context sync, renumber                              ← core, server, mcp
  tokens   design tokens as CSS variables and TS constants
  ui       React components built on tokens                     ← tokens
  config   shared tsconfig and Biome config
apps/
  web      the SPA (bundled into the cli package)               ← ui, schema
  desktop  deferred (ADR-00015)
```

Rules:

- **Every write goes through `core` operations** (`createItem`, `updateFields`, `setState`, `toggleCheck`, `link`, `deleteItem`, `markReviewed`, `renumber`). Operations validate against the schema, allocate IDs, preserve formatting ([[ADR-00008]]) and return the changed item. The server and MCP never write files directly.
- `core` takes a filesystem and a git adapter as interfaces, so it is testable with in-memory fixtures.
- `core` runs in Node only. The browser receives index data and schemas from the server.

## Consequences

- \+ App and agents behave identically; a rule is fixed in one place.
- \+ A desktop shell later only has to host the server and UI.
- − `core` is the critical package and needs the strongest test coverage.
