---
id: ADR-00025
aliases: [ADR-00025]
type: adr
title: Docs, runbooks and context can be retired like decisions
created: 2026-11-04T00:55:59Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-03
deciders: ["@vicentelyrio"]
project: PRJ-00004
---

# Docs, runbooks and context can be retired like decisions

## Context

Splitting [[DOC-00002]] into items left no way to say "this doc is replaced" ([[TASK-00053]]). ADRs have a lifecycle (`proposed`, `accepted`, `deprecated`, `superseded`, with `supersedes` and `superseded_by`); docs, runbooks and context items have only free-form `tags`. A replaced plan or an outdated runbook stays in every list, keeps being counted for freshness, and an agent can still be handed it as context.

## Decision

Docs, runbooks and context items get an optional `status` of `active`, `deprecated` or `superseded`. A missing status means `active`, so no existing file changes. A superseded item may name its replacement in `superseded_by`, and the replacement may list the old one in `supersedes`, as ADRs do.

- `set_state` accepts these statuses for knowledge items, so the app, the CLI and MCP retire a doc the same way they accept an ADR.
- Retired items are not tracked for freshness (as superseded and deprecated ADRs are not today) and are left out of the stale and orphan counts.
- A retired item is not given to agents as context: `include_in_context` is ignored while it is retired, and `context sync` leaves it out.
- Lint warns when an item is `superseded` and names no `superseded_by`, and gives an info note when an active item links to a retired one.
- The Knowledge index shows a retired title struck through with its status pill, as superseded ADRs already are.

ADRs keep their own lifecycle; this does not change them.

## Consequences

- \+ A plan or runbook can be retired without deleting it, and the history and links stay.
- \+ One vocabulary for "this is no longer current" across every knowledge type.
- \+ Freshness and the Inbox stop asking people to review things that are retired.
- \- The schema, `set_state`, lint, freshness, the context sync and the Knowledge views each need to learn the new field.
- \- `status` means something different on an ADR (a decision's progress) than on a doc (is it current); the allowed values differ by type.
