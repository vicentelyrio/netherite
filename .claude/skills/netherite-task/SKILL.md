---
name: netherite-task
description: Pick up, update and complete tasks, ticking checklist items as the work lands. Use when working on a task or asked about what to do next.
---

# Work on a task


These skills use the `netherite` MCP server (`netherite mcp`). If its tools are not available,
say so and stop; do not edit the item files by hand. Refer to items by ID (`TASK-00042`), never
by title or path. Every write is checked against the schema; if a call returns an error, read the
field messages, fix the input and call again.


## Picking up work

1. `list` tasks with `state: backlog` (or `doing`) for the project, or `get` the one you were given.
2. `get` the task and read its body, its `depends_on` tasks and the ADRs it links. If a dependency is not `done`, say so and pick another.
3. `set_state` to `doing`.

## While working

- `toggle_check` each checklist item when that part is finished and verified, not before. Use the item's text or its position.
- Record what you learned in the task body with `update` and a `section` (`mode: append` under `## Notes`).
- Use `base_hash` from `get` when you update, so a change made by someone else is not overwritten. If you get a conflict, `get` again and redo the edit.

## Finishing

1. Every checklist item is ticked, tests and lint pass.
2. `set_state` to `done`.
3. If the change makes a doc out of date, use the `netherite-refresh` skill.

Set `blocked` and say why in the body when you cannot go on.
