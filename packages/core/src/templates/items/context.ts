export const context = `---
id: {{id}}
aliases: [{{id}}]
type: context
title: {{title}}
created: {{created}}
created_by: {{created_by}}
include_in_context: true     # handed to agents; "netherite context sync" writes it to CLAUDE.md and AGENTS.md
priority: normal             # high, normal or low: what goes first when the token budget is short
# targets: [claude, agents]  # claude, agents, or mcp (served over MCP only)
# covers: ["src/**"]
# reviewed_at: 2026-01-15
# owner: "@handle"
# project: PRJ-00001
# status: active
# tags: []
---

# {{title}}

Rules and background an agent needs before it works here. Short, concrete and checkable: every
line costs tokens on every task.

## Rules

- One rule per line, written as an instruction.

## Layout

- Where things live, one line each.
`
