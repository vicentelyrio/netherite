---
id: ADR-00019
aliases: [ADR-00019]
type: adr
title: HTTP API definition lives in packages/api
created: 2026-11-02T00:10:19Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-02
deciders: ["@vicentelyrio"]
project: PRJ-00005
---

# HTTP API definition lives in packages/api

## Context

[[ADR-00010]] defines the local server's API once with Effect Schema, and the app calls it through a typed client. [[ADR-00006]] lists the packages but not where that definition lives. The server needs core, which reads files and runs git. The browser cannot import core, yet it needs the same endpoint and response types.

## Decision

The `HttpApi` definition lives in its own package, `packages/api` (`@netherite/api`): endpoints, request and response schemas, tagged errors with their statuses, and `makeClient`. It depends on `effect` and `@netherite/schema` only and has no Node-only imports, so the app can import it.

- `packages/server` implements it over core (`apiLayer`) and imports `@netherite/api`. `apps/web` imports it for the client and types. No other package does.
- Biome import rules enforce this: `api` may not import any other workspace package except `schema`; `core`, `git`, `mcp`, `cli`, `ui` and `tokens` may not import `api`.
- Statuses: a request the API's own schema rejects (wrong type, missing field) is 400, from the framework. A well-formed request that fails item validation is 422 (`Invalid`), a file changed since it was read or a state that forbids the action is 409 (`Conflict`, `Refused`), no such item is 404, no git for history or stats is 503, and anything else is 500.
- Read models shared with MCP (summaries, item detail, list, search, graph, freshness cache, the combined update) live in `packages/core`, so MCP and HTTP cannot disagree about what an item looks like.

## Consequences

- \+ The app and server cannot drift: both derive from one definition, and the OpenAPI document at `/api/openapi.json` comes from it too.
- \+ The browser bundle gets the API types without core.
- \- One more package to build and version.
- \- Two statuses for "invalid" (400 and 422), which a client has to handle; the typed client surfaces both.
