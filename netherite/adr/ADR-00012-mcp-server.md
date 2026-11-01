---
id: ADR-00012
aliases: [ADR-00012]
type: adr
title: MCP server with full read and write access, validated by the core
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [mcp, agents]
---

# MCP server with full read and write access, validated by the core

## Context

Agents are a primary user. They must be able to plan work, record decisions and keep docs current, not just read.

## Decision

Built with the official `@modelcontextprotocol/sdk`. Transports: **stdio** (`netherite mcp`, the default for agent configs) and **streamable HTTP** at `/mcp` on the local server.

Tool input schemas are the JSON Schema generated from Effect Schema ([[ADR-00003]]), registered through the SDK's low-level `Server`, so zod is not needed.

**Resources**

- `netherite://item/{ID}`: the raw file.
- `netherite://context`: the AI-context bundle (context docs with `include_in_context: true`, by priority, within budget).
- `netherite://schema/{type}`: JSON Schema for each type.

**Tools**

| Tool | Purpose |
|---|---|
| `search` | Full text over ids, titles, paths, bodies; filter by type, status, project, tag |
| `get` | One item with resolved links, backlinks and derived values (progress, freshness) |
| `list` | Items by filter |
| `create` | New item of any type; ID allocated by core; returns id and path |
| `update` | Patch frontmatter fields and/or replace a body section |
| `set_state` | Task state or ADR status, with supersession handled on both ADRs |
| `toggle_check` | Checklist item in a task |
| `link` / `unlink` | Add or remove a typed relationship |
| `delete` | Remove an item; refuses if others link to it unless `force` |
| `mark_reviewed` | Set `reviewed_at` |
| `lint` | Validate one item or the whole workspace |
| `context` | The context bundle, optionally scoped to a project |

- All writes go through core operations ([[ADR-00006]]) with schema validation and format preservation ([[ADR-00008]]). Tool handlers run the core `Effect`s and map their tagged errors to MCP error results.
- Validation errors are returned as structured, field-level messages so the agent can correct itself.
- Every MCP write is appended to `.netherite/local/activity.jsonl` (gitignored), which feeds the Inbox's "changed by agents" section.
- Tools address items only by ID, never by title.

## Consequences

- \+ An agent can do everything the app can, under the same rules.
- \+ People review agent work in the Inbox and in the git diff before committing.
- − A misbehaving agent can create noise. Mitigated by validation, the activity log and the fact that nothing is committed automatically.
