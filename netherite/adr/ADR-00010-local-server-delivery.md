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

- `npx netherite` (alias for `netherite serve`) finds the workspace, builds the index and starts a **Hono** server on `127.0.0.1` (default port 4747, next free if taken), then opens the browser.
- The server serves the prebuilt SPA bundled in the `netherite` package, a JSON API with a typed client (`hono/client`), and a **server-sent events** stream of index changes.
- `@parcel/watcher` watches the content root, `.netherite/config.yml` and `.git/HEAD` / `.git/index`. Changes update the index incrementally and are pushed over SSE.
- **Security:** it binds to loopback only. It rejects requests whose `Host` or `Origin` is not the local server (DNS-rebinding protection). Write endpoints require a random per-session token handed to the SPA at startup.
- The same server can expose MCP over streamable HTTP at `/mcp` ([[ADR-00012]]).

## Consequences

- \+ Zero-install; works in any repo with Node.
- \+ The browser is the UI, with no desktop packaging for v2.0.
- − Requires Node on the machine. A compiled binary is a later option.
