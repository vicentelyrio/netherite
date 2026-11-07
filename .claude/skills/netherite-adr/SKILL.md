---
name: netherite-adr
description: Record an architecture or design decision as an ADR, link it to the work it affects, or supersede an earlier one. Use when a choice with lasting consequences is made or changed.
---

# Record a decision


These skills use the `netherite` MCP server (`netherite mcp`). If its tools are not available,
say so and stop; do not edit the item files by hand. Refer to items by ID (`TASK-00042`), never
by title or path. Every write is checked against the schema; if a call returns an error, read the
field messages, fix the input and call again.


## Steps

1. `search` for an existing ADR on the topic. If one exists and still holds, link to it instead of writing a new one.
2. `create` with `type: adr`, a title that states the decision, `fields.status` (`proposed` until a person accepts it), `fields.date` and `fields.deciders` (@handles).
3. Put the text in `body` with three sections: **Context** (the forces, briefly), **Decision** (what was chosen, in the active voice, with the whole section in a blockquote, each line starting with `>`),**Consequences** (what gets easier, what gets harder; start each bullet with `\+` or `\-`). If you can run commands, `netherite templates adr` prints this workspace's template; follow its sections.
4. `link` the new ADR to what it affects: the project (`fields.project`), and each task or project that follows from it.
5. `lint` the new item and fix what it reports.

## Changing a decision

An accepted ADR is not edited to say something different. Create a new ADR, then call `link` with `kind: supersedes` (from the new one to the old one), or `set_state` on the old one with `state: superseded` and `superseded_by`. Both files are updated together.

## Do not

- Do not mark an ADR `accepted` yourself; ask the person.
- Do not delete an ADR. Deprecate or supersede it.
