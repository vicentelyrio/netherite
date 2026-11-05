---
id: ADR-00013
aliases: [ADR-00013]
type: adr
title: Agent skills and AI-context sync into CLAUDE.md and AGENTS.md
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [agents, skills, context]
---

# Agent skills and AI-context sync into CLAUDE.md and AGENTS.md

## Context

MCP gives agents tools; they still need to know *when* and *how* to use them in this repo's conventions. Some agents only read instruction files and never call MCP.

## Decision

### Skills

`netherite init` installs skills into `.claude/skills/netherite-*/SKILL.md` and a short "How this repo tracks work" section in `AGENTS.md`. Initial skills:

- **netherite-adr**: record a decision (context, decision, consequences), link it to the projects and tasks it affects, handle supersession.
- **netherite-plan**: break a goal or request into a project and tasks with checklists, `depends_on` and linked ADRs.
- **netherite-task**: pick up, update and complete tasks, ticking checklist items as work lands.
- **netherite-refresh**: review a stale or drifting doc against the changed code and mark it reviewed.
- **netherite-context**: create or update context docs and keep them within budget.

Skills refer to items only by ID and call the MCP tools from [[ADR-00012]]. They are versioned with the package; `netherite init --update` refreshes them without touching user-edited skills.

### Context sync

- `netherite context sync` renders context docs with `include_in_context: true` into each configured target, ordered by priority, between markers:

```
<!-- netherite:context:start -->
…generated…
<!-- netherite:context:end -->
```

- Text outside the markers is never touched. If the markers are missing, the block is appended.
- A token budget (default 8,000, configurable) is enforced. Counts are estimates and shown as "≈". Items that do not fit are listed in a warning, lowest priority first.
- `netherite context sync --check` fails when targets are out of date (for CI). The app shows the same state on the context doc view.
- Like everything else, sync only writes files; it never commits.

## Consequences

- \+ Agents that only read `CLAUDE.md` or `AGENTS.md` still get curated context.
- \+ Repo conventions for planning and decisions travel with the repo.
- − Generated blocks in instruction files must be kept in sync, which is why `--check` exists.
