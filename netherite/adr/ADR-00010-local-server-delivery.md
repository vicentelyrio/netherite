---
id: ADR-00010
aliases: [ADR-00010]
type: adr
title: Deliver the app as a local server started with npx netherite
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [server, delivery]
---

# Deliver the app as a local server started with npx netherite

## Context

The app needs filesystem and git access and must work in any repo without an install step, much like Storybook.

## Decision

> - `npx netherite` (alias for `netherite serve`) finds the workspace, builds the index and starts an **Effect `HttpApi`** server (`@effect/platform`, `@effect/platform-node`) on `127.0.0.1` (default port 4747, next free if taken), then opens the browser.
> - The API is defined once with Effect Schema ([[ADR-00003]]). The server implementation, the typed `HttpApiClient` used by the SPA and the API documentation all derive from that definition. Failures are tagged errors mapped to statuses (validation 422, conflict 409, not found 404).
> - The server serves the prebuilt SPA bundled in the `netherite` package and a **server-sent events** stream of index changes (an Effect `Stream`).
> - `@parcel/watcher` watches the content root, `.netherite/config.yml` and `.git/HEAD` / `.git/index`, wrapped as a `Stream`. Changes update the index incrementally and are pushed over SSE.
> - **Security:** it binds to loopback only. Middleware rejects requests whose `Host` or `Origin` is not the local server (DNS-rebinding protection). Write endpoints require a random per-session token handed to the SPA at startup.
> - The same server exposes MCP over streamable HTTP at `/mcp` ([[ADR-00012]]). The MCP SDK transport expects Node request and response objects, which `@effect/platform-node` can provide for a raw route.
> - Hono was considered: smaller and more common, but it would add a second error model and a second validation path next to Effect ([[ADR-00006]]).

## Consequences

- \+ Zero-install; works in any repo with Node.
- \+ The browser is the UI, with no desktop packaging for v2.0.
- − Requires Node on the machine. A compiled binary is a later option.
