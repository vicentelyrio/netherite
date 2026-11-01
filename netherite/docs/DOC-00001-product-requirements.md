---
id: DOC-00001
aliases: [DOC-00001]
type: doc
title: Netherite v2 — Product requirements
owner: "@vicentelyrio"
tags: [prd, v2]
created: 2026-10-31
reviewed_at: 2026-10-31
covers: []
---

# Netherite v2 — Product requirements

## Summary

Netherite turns a git repository into a typed, linked knowledge base for the work done in it: **goals (milestones), projects, tasks, decisions (ADRs), docs, AI context and runbooks**, all stored as Markdown files with YAML frontmatter inside the repo.

It has two first-class users that share the same files:

- **AI agents**, through an MCP server and installable skills. Agents can read and create or change everything.
- **People**, through a local app (`npx netherite`) that visualizes the repo (boards, graph, decision log, freshness) and allows light edits.

Netherite never commits. It writes files; people and their usual git workflow decide what lands.

## Problem

- Decisions, docs and plans drift away from the code they describe, and nobody notices until they are wrong.
- AI agents need curated, current context and a structured place to record plans and decisions. Today that is ad-hoc `CLAUDE.md` text and loose notes.
- Task trackers live outside the repo, so they are invisible to agents and do not branch, diff or review with the code.
- Plain Markdown folders have no types, no validation, no relationships and no overview.

## Users and jobs

| User | Jobs |
|---|---|
| Developer working with agents | Ask an agent to plan work as goals, projects and tasks; record decisions as ADRs; keep agent context current; review what the agent produced. |
| Teammate / reviewer | Understand why the code is the way it is (ADRs, supersession), find docs, see progress, spot stale knowledge. |
| Agent (via MCP / skills) | Fetch relevant context, search, create and update items with stable IDs, validate what it wrote. |

There are no accounts. People are git identities (`@handle`). Whoever can write to the repo can commit Netherite files like any other file.

## Principles

1. **Files are the source of truth.** No database. Every state is reconstructable from the working tree and git history. ([[ADR-00002]])
2. **Git-native, read-only on git.** Netherite reads status, diffs and history; it never stages, commits or switches branches. ([[ADR-00007]])
3. **Obsidian-compatible.** The repo opens as an Obsidian vault; links are `[[wikilinks]]`. ([[ADR-00004]])
4. **Stable IDs for machines.** Agents and skills address items as `ADR-00007`, `TASK-00042`. ([[ADR-00004]])
5. **Touch only what changed.** Edits from the app or agents never reformat a file. ([[ADR-00008]])
6. **One schema, everywhere.** The same schemas validate the UI, the linter and every agent write. ([[ADR-00003]])

## Concepts

| Type | ID | Purpose | Key fields |
|---|---|---|---|
| Goal | `GOAL-` | A milestone or outcome | `status`, `area`, `due` |
| Project | `PRJ-` | A body of work under one or more goals | `goals`, `status`, `owner` |
| Task | `TASK-` | A unit of work, with a checklist in its body | `project`, `state`, `assignees`, `labels`, `decisions`, `depends_on`, `related` |
| ADR | `ADR-` | An architecture decision | `status`, `date`, `deciders`, `supersedes`, `superseded_by` |
| Doc | `DOC-` | Explanatory documentation | `covers`, `reviewed_at`, `explains` |
| Context | `CTX-` | Curated context for agents | `include_in_context`, `targets`, `priority` |
| Runbook | `RUN-` | Operational procedure | `covers`, `reviewed_at`, `explains` |

Typed relationships, shown in the graph: **belongs to** (task → project → goal), **implements** (task/project → ADR), **explains** (doc/runbook/context → work item), **supersedes** (ADR → ADR), **co-changes** (derived from git). Body `[[links]]` produce backlinks. Full schema in [[ADR-00003]].

## Surfaces

### App (local, `npx netherite`)

Navigation rail: Search (⌘K), Inbox, Goals, Projects, Knowledge, Stats, Tags, Graph.

| Screen | What it shows |
|---|---|
| **Inbox** | What a person should review: items created or changed in the working tree (typically by agents), proposed ADRs awaiting a decision, stale docs, orphans, lint errors, blocked tasks. |
| **Goals overview** | Goals grouped by `area`, with progress rings and project cards. |
| **Goal detail** | Horizon/due and progress, its projects, a focused graph. |
| **Project** | Views: **Tasks** (kanban by state, drag to change state), **Docs** (docs and runbooks scoped to the project), **Knowledge** (all knowledge linked to the project), **Design** (design links and image assets referenced by the project). Mini graph. |
| **Task drawer** | Split view: source (CodeMirror with schema lint and git diff gutter) and rendered view. Checklist toggles write back to Markdown. Decisions row links ADRs. |
| **Knowledge index** | All knowledge by type, with filters (type, status, project, tag), stale and orphan toggles, preview panel with backlinks and co-changed files. Empty state with starters. |
| **Doc view** | Doc / ADR / context variants: stale banner with "Mark reviewed", supersession banner and lifecycle steps, AI-context toggle with token budget and sync targets. |
| **Decision log** | ADR status changes from git history, lanes per project, supersession chains. |
| **Graph** | Typed nodes and edges, hover details, click to focus, toggle types. |
| **Search** | Palette over titles, IDs, paths and bodies, grouped by type. |
| **Stats** | Progress and throughput over time, derived from git history. |
| **Tags** | Browse and manage labels across all types. |

Visual language comes from the "Netherite Refined" design (tokens, type, spacing, status and type colours).

### MCP server

Agents can search, read, create, update, link and delete every item type, fetch an AI-context bundle and run lint. Every write is schema-validated and returns the item's ID and path. ([[ADR-00012]])

### Skills

`netherite init` installs agent skills (new ADR, plan work into goals/projects/tasks, update task state, refresh a stale doc, record a decision) that call the MCP tools. ([[ADR-00013]])

### CLI

`netherite init | serve | mcp | new <type> | lint | context sync [--check] | renumber`.

## Key behaviours

- **Freshness.** Docs, runbooks and context declare `covers:` (path globs). Commits that touched covered files since `reviewed_at` make them *drifting* (1–9) or *stale* (≥10). ([[ADR-00009]])
- **Orphans.** Knowledge that nothing links to is flagged. Agents still receive orphaned context.
- **AI-context sync.** Context docs with `include_in_context: true` are rendered into `CLAUDE.md` / `AGENTS.md` between markers, within a token budget, and served over MCP. ([[ADR-00013]])
- **Lint.** Schema errors, broken links, duplicate IDs and out-of-date context sync show in the editor, the Inbox, the CLI and CI.
- **Live.** The app updates as files change on disk, whoever changed them.

## Non-goals (v2)

- A v1 data importer. v1 was an early prototype with no users; its data can be recreated with the MCP server. An importer can be added after 2.0 if needed.
- Committing, branching, pushing or any other git write.
- Accounts, authentication, permissions or multi-tenant hosting.
- Cloud sync or real-time collaborative editing.
- A desktop app in v2.0 (the shell is deferred, [[ADR-00015]]).
- A general-purpose note-taking app.

## Success criteria

- An agent with only the MCP server can plan a feature into goals, projects and tasks and record its ADRs, and the result lints clean.
- Opening a repo with ~5,000 Netherite files shows the app in under 2 seconds, and changes on disk appear in under 500 ms.
- Editing a field from the app or MCP changes only that field's lines in the file.
- A stale doc is visible in the Inbox without anyone having to look for it.

## Open questions

- The exact content of the project **Design** view needs a design pass.
- Windows is best-effort in 2.0: the git adapter is tested on a Windows CI runner, and the app has a smoke test. Full parity is out of scope until reported.

## Decisions

All ADRs are `accepted`. From now on a change of meaning needs a new ADR that supersedes the old one.

[[ADR-00001]] ADRs in this repo · [[ADR-00002]] workspace and layout · [[ADR-00003]] data model with Effect Schema · [[ADR-00004]] IDs and links · [[ADR-00005]] tooling · [[ADR-00006]] architecture · [[ADR-00007]] git · [[ADR-00008]] format-preserving edits · [[ADR-00009]] freshness · [[ADR-00010]] local server · [[ADR-00011]] frontend with Mantine · [[ADR-00012]] MCP · [[ADR-00013]] skills and context sync · [[ADR-00014]] search and graph · [[ADR-00015]] desktop deferred · [[ADR-00016]] retire v1
