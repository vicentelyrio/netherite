---
id: ADR-00003
aliases: [ADR-00003]
type: adr
title: Data model and frontmatter schemas, with Effect Schema as the single source of truth
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [schema, data-model, effect]
---

# Data model and frontmatter schemas, with Effect Schema as the single source of truth

## Context

The same rules must hold in the app editor, the CLI linter, CI and every agent write over MCP. Agents also need machine-readable schemas to write valid files on the first try. Netherite is built on **Effect** as its one library ([[ADR-00006]]); `Schema` gives decoding with structured, path-aware errors and branded types, and its failures flow through the same typed error channel as the rest of `core`.

## Decision

> Schemas are defined once in `packages/schema` with **Effect Schema** (`effect` package, `Schema` module). `packages/schema` has no dependency except `effect`.
>
> - **JSON Schema** is generated with `JSONSchema.make` for the editor, MCP tool input schemas and skills.
> - **Unknown fields** are preserved: decode with `onExcessProperty: "preserve"` and report them as lint info.
> - **Branded types** for `ItemId`, `Handle` (`@handle`) and per-prefix IDs, so a `TaskId` cannot be passed where a `ProjectId` is expected.
> - **Errors:** decode failures are mapped to field-level messages (path, expected, received) with `ArrayFormatter`, and returned unchanged by the MCP and HTTP adapters.
> - **MCP SDK:** the high-level `McpServer.registerTool` expects zod shapes. The MCP package uses the SDK's low-level `Server` request handlers with the generated JSON Schema, so zod is not a dependency of Netherite ([[ADR-00012]]).
>
> ### Common fields (all types)
>
> | Field | Type | Notes |
> |---|---|---|
> | `id` | string | `PREFIX-NNNNN`, see [[ADR-00004]] |
> | `aliases` | string[] | Always contains `id` (for Obsidian) |
> | `type` | enum | `goal`, `project`, `task`, `adr`, `doc`, `context`, `runbook` |
> | `title` | string | Required |
> | `tags` | string[] | Optional |
> | `created` | date-time | Set on creation |
> | `created_by` | `@handle` | From `git config user.*` at creation |
>
> ### Per type
>
> - **goal**: `status` (`active`, `achieved`, `dropped`), `area` (string, groups the overview), `due` (date, optional), `owner`.
> - **project**: `goals` (GOAL ids, one or more), `status` (`active`, `paused`, `done`, `archived`), `owner`, `labels`, `decisions` (ADR ids), `design` (list of `{label, url}`).
> - **task**: `project` (PRJ id), `state` (one of the states in config), `assignees`, `labels`, `decisions` (ADR ids), `depends_on` (TASK ids, shown as "waiting on"), `related` (any ids), `due`. The checklist is a GFM task list in the body; progress is derived from it.
> - **adr**: `status` (`proposed`, `accepted`, `deprecated`, `superseded`), `date`, `deciders`, `project` (optional; repo-wide if absent), `supersedes` (ADR ids), `superseded_by` (ADR id).
> - **doc**, **runbook**: `owner`, `project` (optional), `explains` (ids), `covers` (path globs), `reviewed_at` (date).
> - **context**: as doc, plus `include_in_context` (bool), `targets` (`claude`, `agents`, `mcp`), `priority` (`high`, `normal`, `low`).
>
> ### Edges
>
> Typed edges come only from frontmatter:
>
> | Edge | From |
> |---|---|
> | belongs to | `task.project`, `project.goals` |
> | implements | `task.decisions`, `project.decisions` |
> | explains | `doc/runbook/context.explains` and `.project` |
> | supersedes | `adr.supersedes` (and the inverse `superseded_by`) |
> | depends on | `task.depends_on` |
> | co-changes | derived from git ([[ADR-00009]]) |
>
> Body `[[wikilinks]]` create untyped *references*, used for backlinks and orphan detection.

## Consequences

- \+ One definition drives validation, editor autocomplete, MCP input schemas and docs.
- \+ Derived values (progress, freshness, backlinks) are never stored, so they cannot go stale.
- \+ Path-aware errors and branded IDs catch agent mistakes before a write.
- − Effect has a steeper learning curve and a larger footprint than zod. The browser imports `Schema` and the typed HTTP client only; a size budget is checked in CI.
- − Schema changes need a migration story; `netherite lint --fix` handles renames when they happen.
