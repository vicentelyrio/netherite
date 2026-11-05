---
id: TASK-00030
aliases: [TASK-00030]
type: task
title: "`serve` command"
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00005
state: done
depends_on: [TASK-00027, TASK-00019]
---

# `serve` command

- [x] Serve the built SPA from the package; default port 4747, falls back to the next free one
- [x] Open the browser; `--no-open`, `--port`
- [x] MCP over streamable HTTP at `/mcp`, mounted as a raw route using the Node request and response from `@effect/platform-node` (`NodeHttpServerRequest`)
