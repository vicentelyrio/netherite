---
id: ADR-00003
aliases: [ADR-00003]
type: adr
title: Data model and frontmatter schemas, with zod as the single source of truth
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [schema, data-model]
---

# Data model and frontmatter schemas, with zod as the single source of truth

## Context

The same rules must hold in the app editor, the CLI linter, CI and every agent write over MCP. Agents also need machine-readable schemas to write valid files on the first try.

## Decision

Schemas are defined once in `packages/schema` with **zod**. JSON Schema is generated from them for the editor, for MCP tool input schemas and for skills.

### Common fields (all types)

| Field | Type | Notes |
|---|---|---|
| `id` | string | `PREFIX-NNNNN`, see [[ADR-00004]] |
| `aliases` | string[] | Always contains `id` (for Obsidian) |
| `type` | enum | `goal`, `project`, `task`, `adr`, `doc`, `context`, `runbook` |
| `title` | string | Required |
| `tags` | string[] | Optional |
| `created` | date-time | Set on creation |
| `created_by` | `@handle` | From `git config user.*` at creation |

### Per type

- **goal**: `status` (`active`, `achieved`, `dropped`), `area` (string, groups the overview), `due` (date, optional), `owner`.
- **project**: `goals` (GOAL ids, one or more), `status` (`active`, `paused`, `done`, `archived`), `owner`, `labels`, `decisions` (ADR ids), `design` (list of `{label, url}`).
- **task**: `project` (PRJ id), `state` (one of the states in config), `assignees`, `labels`, `decisions` (ADR ids), `depends_on` (TASK ids, shown as "waiting on"), `related` (any ids), `due`. The checklist is a GFM task list in the body; progress is derived from it.
- **adr**: `status` (`proposed`, `accepted`, `deprecated`, `superseded`), `date`, `deciders`, `project` (optional; repo-wide if absent), `supersedes` (ADR ids), `superseded_by` (ADR id).
- **doc**, **runbook**: `owner`, `project` (optional), `explains` (ids), `covers` (path globs), `reviewed_at` (date).
- **context**: as doc, plus `include_in_context` (bool), `targets` (`claude`, `agents`, `mcp`), `priority` (`high`, `normal`, `low`).

Unknown fields are allowed and preserved (lint info, not error), so people can extend files without breaking them.

### Edges

Typed edges come only from frontmatter:

| Edge | From |
|---|---|
| belongs to | `task.project`, `project.goals` |
| implements | `task.decisions`, `project.decisions` |
| explains | `doc/runbook/context.explains` and `.project` |
| supersedes | `adr.supersedes` (and the inverse `superseded_by`) |
| depends on | `task.depends_on` |
| co-changes | derived from git ([[ADR-00009]]) |

Body `[[wikilinks]]` create untyped *references*, used for backlinks and orphan detection.

## Consequences

- \+ One definition drives validation, editor autocomplete, MCP input schemas and docs.
- \+ Derived values (progress, freshness, backlinks) are never stored, so they cannot go stale.
- − Schema changes need a migration story; `netherite lint --fix` handles renames when they happen.
