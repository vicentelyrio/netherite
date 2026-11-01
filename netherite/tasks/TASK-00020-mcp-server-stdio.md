---
id: TASK-00020
aliases: [TASK-00020]
type: task
title: MCP server (stdio)
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: done
depends_on: [TASK-00013, TASK-00016]
---

# MCP server (stdio)

- [x] Resources: `netherite://item/{ID}`, `netherite://context`, `netherite://schema/{type}`
- [x] Tools: `search`, `get`, `list`, `create`, `update`, `set_state`, `toggle_check`, `link`, `unlink`, `delete`, `mark_reviewed`, `lint`, `context`
- [x] Input schemas generated from `packages/schema` as JSON Schema, served through the SDK's low-level `Server` (no zod dependency, see [[ADR-00003]])
- [x] Field-level validation errors returned to the agent
- [x] `netherite mcp` command
