---
id: DOC-00002
aliases: [DOC-00002]
type: doc
title: Netherite v2 — Implementation plan
owner: "@vicentelyrio"
tags: [plan, v2]
created: 2026-10-31
reviewed_at: 2026-10-31
covers: []
explains: [DOC-00001]
---

# Netherite v2 — Implementation plan

Plan for [[DOC-00001]], following [[ADR-00001]] to [[ADR-00016]].

This is a single draft document. Once milestone 1 ships, it is split into real `GOAL`, `PRJ` and `TASK` files **using Netherite's own MCP server**, which is the first dogfooding test. The IDs below are reserved for that split.

## Milestones (goals)

| Goal | Milestone | Projects | Done when |
|---|---|---|---|
| GOAL-00001 | **M1 · Headless.** Agents can plan and record decisions | PRJ-00001 → PRJ-00004 | An agent using only `netherite mcp` turns this document into goal, project and task files, and `netherite lint` passes on the repo |
| GOAL-00002 | **M2 · App.** People can see and review the work | PRJ-00005 → PRJ-00007 | Every screen in DOC-00001 works against this repo, updating live |
| GOAL-00003 | **M3 · Release.** `npx netherite` 2.0 is published | PRJ-00008 | A fresh repo goes from `npx netherite init` to a working app and agent setup in under 5 minutes |

M1 comes first on purpose: the core rules, IDs and edits get proven by agents and tests before any UI depends on them.

## Dependency overview

```
PRJ-01 reset ─► PRJ-02 schema+core ─┬─► PRJ-03 git ─────────┐
                                    └─► PRJ-04 cli+mcp ◄────┘  ═► M1
PRJ-02 ─► PRJ-05 server ─┐
PRJ-03 ─(TASK-18)────────┼─► PRJ-07 app screens               ═► M2
PRJ-06 design system ────┘
PRJ-04 + PRJ-07 ─► PRJ-08 release                             ═► M3
```

PRJ-06 (design system) depends only on PRJ-01, so it can run in parallel with M1. PRJ-05 needs only PRJ-02. PRJ-07 also needs the history queries from PRJ-03 (TASK-00018) for the decision log and stats, and the activity log from PRJ-04 (TASK-00021) for the Inbox.

---

## GOAL-00001 · M1 Headless

### PRJ-00001 · Repo reset and tooling

ADRs: [[ADR-00005]], [[ADR-00016]]

**TASK-00001 · Remove the v1 stack**
- [ ] Delete `services/*`, the v1 `packages/*`, `apps/desktop` and `apps/web`
- [ ] Remove yarn, ESLint, Prettier and CircleCI configuration
- [ ] Keep changesets, `.editorconfig`, README, licence and community files
- Done when: the repo contains only shared config, `netherite/` and root files.

**TASK-00002 · pnpm, turbo, Biome, lefthook** (after TASK-00001)
- [ ] pnpm workspaces (`apps/*`, `packages/*`), `.nvmrc` on current Node LTS
- [ ] turbo pipeline: `build`, `dev`, `typecheck`, `lint`, `test`
- [ ] Biome at the root; lefthook pre-commit runs Biome and typecheck
- Done when: `pnpm i && pnpm lint && pnpm typecheck` pass on an empty workspace.

**TASK-00003 · Shared config package** (after TASK-00002)
- [ ] `packages/config`: strict ESM tsconfig bases (node, browser), Biome preset
- [ ] tsdown setup for library packages
- [ ] Package template: `src/`, `test/`, exports map, `build`/`test` scripts

**TASK-00052 · Scaffold the packages** (after TASK-00003)
- [ ] Empty `packages/schema`, `git`, `core`, `server`, `mcp`, `cli`, `tokens`, `ui` and `apps/web` from the package template, with the dependency directions in [[ADR-00006]]
- [ ] Lint rule that fails on forbidden imports (for example `core` importing `server`, anything but `ui` importing Mantine)
- Done when: `pnpm build` and `pnpm typecheck` pass across all empty packages.

**TASK-00004 · Test setup and fixture workspace** (after TASK-00003)
- [ ] Vitest workspace config with `@effect/vitest`
- [ ] `fixtures/basic`: a small workspace with every item type, links, a supersession chain, an orphan and lint errors
- [ ] Helper that creates a temporary git repo from a fixture with a scripted commit history

**TASK-00005 · GitHub Actions CI** (after TASK-00004)
- [ ] Jobs: install, lint, typecheck, test, build
- [ ] Cache the pnpm store and turbo
- [ ] Matrix: Linux and macOS for everything; Windows for `packages/git` and `core` tests (best-effort support, see [[DOC-00001]])
- [ ] Bundle check: the browser build imports only `Schema` and the HTTP client from `effect` (size budget)
- [ ] Placeholder step for `netherite lint` on this repo (enabled in TASK-00026)

### PRJ-00002 · Schema and core

ADRs: [[ADR-00002]], [[ADR-00003]], [[ADR-00004]], [[ADR-00006]], [[ADR-00008]], [[ADR-00014]]

**TASK-00006 · `packages/schema`** (after TASK-00003)
- [ ] Effect Schema definitions: common fields plus goal, project, task, adr, doc, context, runbook
- [ ] ID format, prefixes and padding; branded `ItemId` per prefix and `Handle` types
- [ ] Config schema (`.netherite/config.yml`), including task states and their categories
- [ ] JSON Schema export for each type (`JSONSchema.make`)
- [ ] Unknown fields allowed and preserved (`onExcessProperty: "preserve"`)
- [ ] Decode errors mapped to field-level messages (path, expected, received)
- Done when: every fixture item validates, and each invalid fixture gives the expected field-level error.

**TASK-00007 · Workspace discovery and config loading** (after TASK-00006)
- [ ] Walk up from the current directory to `.netherite/config.yml`
- [ ] Defaults, merging, validation errors with file and line
- [ ] Use the platform `FileSystem` service, with an in-memory layer for tests

**TASK-00008 · Parser and shared remark plugins** (after TASK-00006)
- [ ] Frontmatter plus mdast, keeping source positions
- [ ] Wikilink plugin: `[[t]]`, `[[t|label]]`, `[[t#heading]]`; ignores code spans and code blocks
- [ ] Extracts the checklist (with positions), headings and plain text
- [ ] Publish the plugins so the app reuses them (TASK-00034)

**TASK-00009 · IDs and link resolution** (after TASK-00008)
- [ ] Allocate the next ID per prefix from the working tree
- [ ] Resolve id → alias → file name → title; report ambiguous and broken links
- [ ] File name slugging (`<ID>-<slug>.md`)

**TASK-00010 · Index and graph** (after TASK-00009)
- [ ] Item index with derived values (progress, backlinks, orphan flag)
- [ ] graphology graph with the typed edges from ADR-00003 plus references
- [ ] MiniSearch index (id and title boosted)
- [ ] Incremental update API (add, change, remove a path)
- [ ] Benchmark: 5,000 generated files indexed in under 2 s

**TASK-00011 · Lint rules** (after TASK-00010)
- [ ] Schema errors; broken and ambiguous links; duplicate IDs
- [ ] Missing ID in `aliases`; file outside its type folder; file name not matching the ID
- [ ] Orphans (info); unknown fields (info)
- [ ] Machine-readable result: path, line, column, rule, severity, message
- [ ] Fixable rules (missing ID in `aliases`, file name not matching the ID, renamed fields after a schema change) return a fix as a core operation; applying it is covered by TASK-00019 `--fix`

**TASK-00012 · Format-preserving edit engine** (after TASK-00008)
- [ ] Frontmatter edits through the `yaml` Document API (set, unset, append to a list)
- [ ] Body edits by splicing at mdast positions (toggle checklist item, replace or append a section)
- [ ] Keep line endings, trailing newline and indentation
- [ ] Golden-file tests for each edit
- Done when: an edit to one field changes only that field's lines in every golden test.

**TASK-00013 · Operations API** (after TASK-00009, TASK-00012)
- [ ] `createItem`, `updateFields`, `setState`, `toggleCheck`, `link`/`unlink`, `deleteItem`, `markReviewed`, `renumber`
- [ ] Validate before every write; failures are tagged errors (`ValidationError`, `ConflictError`, `NotFound`)
- [ ] Optimistic concurrency with content hashes; atomic temp-file-and-rename writes
- [ ] Supersession updates both ADRs; `deleteItem` refuses while linked unless forced
- [ ] `renumber` rewrites links in frontmatter and bodies

**TASK-00014 · Watcher integration** (after TASK-00010)
- [ ] `@parcel/watcher` on the content root and config
- [ ] Debounced incremental re-index; changes exposed as an Effect `Stream` of typed events

### PRJ-00003 · Git integration and freshness

ADRs: [[ADR-00007]], [[ADR-00009]]

**TASK-00015 · `packages/git` read-only adapter** (after TASK-00004)
- [ ] `Git` service over `@effect/platform` `Command`: no shell, argument arrays, timeouts; tagged errors
- [ ] `status --porcelain=v2`, `log` with name-only and numstat, `rev-parse`, `config user.*`
- [ ] Cache keyed by `HEAD` and index modification time
- [ ] Graceful degrade without git, outside a repo, or in a shallow clone
- [ ] A test that the adapter exposes no write commands

**TASK-00016 · Freshness** (after TASK-00015, TASK-00010)
- [ ] Glob matching for `covers:`; baseline from `reviewed_at` or the last commit touching the file
- [ ] Count commits since baseline, plus uncommitted changes
- [ ] States with configurable thresholds; "not tracked" rules
- [ ] Lint warning for drifting and stale items

**TASK-00017 · Co-change** (after TASK-00015)
- [ ] For each item, the files most often changed in the same commits
- [ ] Suggested `covers:` entries

**TASK-00018 · History queries** (after TASK-00015)
- [ ] ADR status transitions over time (frontmatter diffs in `git log -p`) for the decision log
- [ ] Task state transitions and done-per-week counts for stats
- [ ] Authors per item

### PRJ-00004 · CLI, MCP, skills and context

ADRs: [[ADR-00012]], [[ADR-00013]]

**TASK-00019 · CLI skeleton** (after TASK-00013)
- [ ] `netherite` binary built with `@effect/cli`, with commands `init`, `new <type>`, `lint`, `renumber`
- [ ] `init` creates the config, folders and `.gitignore` entry for `.netherite/local/`
- [ ] `lint` output: human-readable and `--json`; exit codes for CI
- [ ] `lint --fix` applies the fixable rules through core operations (never commits); `--fix --dry-run` prints the diff

**TASK-00020 · MCP server (stdio)** (after TASK-00013, TASK-00016)
- [ ] Resources: `netherite://item/{ID}`, `netherite://context`, `netherite://schema/{type}`
- [ ] Tools: `search`, `get`, `list`, `create`, `update`, `set_state`, `toggle_check`, `link`, `unlink`, `delete`, `mark_reviewed`, `lint`, `context`
- [ ] Input schemas generated from `packages/schema` as JSON Schema, served through the SDK's low-level `Server` (no zod dependency, see [[ADR-00003]])
- [ ] Field-level validation errors returned to the agent
- [ ] `netherite mcp` command

**TASK-00021 · Activity log** (after TASK-00020)
- [ ] Append each MCP write to `.netherite/local/activity.jsonl` (time, tool, id, path, hash)
- [ ] Read API for the Inbox

**TASK-00022 · Context sync** (after TASK-00013)
- [ ] Render the bundle by priority within the token budget; estimated counts
- [ ] Write between markers in `CLAUDE.md` / `AGENTS.md`; never touch text outside them
- [ ] `context sync --check` for CI; warning listing items that did not fit

**TASK-00023 · Skills** (after TASK-00020)
- [ ] `netherite-adr`, `netherite-plan`, `netherite-task`, `netherite-refresh`, `netherite-context`
- [ ] `init` installs them into `.claude/skills/` and adds the AGENTS.md section
- [ ] `init --update` refreshes skills without overwriting ones the user edited

**TASK-00024 · MCP end-to-end tests** (after TASK-00020)
- [ ] Scripted MCP client against fixture repos: create, update, link, supersede, delete
- [ ] Assert exact file diffs and clean lint after each step

**TASK-00025 · Dogfood: split this plan** (after TASK-00023)
- [ ] Using only the MCP server and skills, create GOAL-00001…00003, PRJ-00001…00008 and the tasks in this document
- [ ] Mark the tasks already done
- [ ] Record any friction as tasks or ADRs
- [ ] Mark this document superseded by the generated items

**TASK-00026 · CI lint on this repo** (after TASK-00019, TASK-00022)
- [ ] Enable `netherite lint` and `netherite context sync --check` in CI

---

## GOAL-00002 · M2 App

### PRJ-00005 · Local server

ADRs: [[ADR-00010]]

**TASK-00027 · Effect HttpApi server** (after TASK-00013)
- [ ] Read endpoints: items, item, search, graph, lint, inbox data, history and stats
- [ ] Write endpoints mapped to core operations, with hash-based conflicts returned as 409
- [ ] API defined once with Effect Schema; typed `HttpApiClient` exported for the app
- [ ] Tagged errors mapped to statuses (422 validation, 409 conflict, 404 not found)

**TASK-00028 · Live updates over SSE** (after TASK-00027, TASK-00014)
- [ ] Event stream for item changes, git status changes and lint changes
- [ ] Watch `.git/HEAD` and `.git/index` too

**TASK-00029 · Server security** (after TASK-00027)
- [ ] Bind to 127.0.0.1 only; check `Host` and `Origin`
- [ ] Per-session token for write endpoints
- [ ] Tests for rejected cross-origin and DNS-rebinding requests

**TASK-00030 · `serve` command** (after TASK-00027, TASK-00019)
- [ ] Serve the built SPA from the package; default port 4747, falls back to the next free one
- [ ] Open the browser; `--no-open`, `--port`
- [ ] MCP over streamable HTTP at `/mcp`, mounted as a raw route using the Node request and response from `@effect/platform-node`

### PRJ-00006 · Design system

ADRs: [[ADR-00011]]. Can run in parallel with M1.

**TASK-00031 · `packages/tokens`** (after TASK-00003)
- [ ] Colour, type, spacing and radius tokens from the "Netherite Refined" token sheets (T1, T2)
- [ ] Type colours and glyph shapes, ADR status, freshness, graph node and edge styles, syntax colours
- [ ] Output as CSS variables, TS constants and a Mantine theme (`createTheme`)

**TASK-00032 · Fonts and icons** (after TASK-00031)
- [ ] Self-hosted Source Sans 3, Source Code Pro and Material Symbols Rounded

**TASK-00033 · `packages/ui` components** (after TASK-00032)
- [ ] Mantine provider with the generated theme; `classNames` overrides to match the design; dark theme
- [ ] Wrappers over Mantine: Button, ActionIcon, Chip, Avatar, Card, Progress, RingProgress, SegmentedControl, Tabs, Switch, Tooltip, Menu, Modal, Drawer
- [ ] Domain components: TypeBadge, StatusPill, FreshnessLabel, Banner, EmptyState, Card states (hover, selected, drop target)
- [ ] Rail with keyboard shortcuts
- [ ] Only `packages/ui` imports Mantine (enforced by the TASK-00052 lint rule)
- [ ] Component preview page (`/dev/ui` route in the app)

### PRJ-00007 · App screens

ADRs: [[ADR-00011]], [[ADR-00014]]

**TASK-00034 · App shell** (after TASK-00027, TASK-00033)
- [ ] Vite + React 19 single-page app (Next.js static export considered and rejected, see [[ADR-00011]]), TanStack Router and Query
- [ ] SSE invalidates queries; conflict handling
- [ ] Rail navigation and global shortcuts (⌘K, ⌘I, ⌘G, ⌘P, ⌘L, ⌘D, ⌘T, ⇧⌘G)
- [ ] Markdown renderer using the shared remark plugins

**TASK-00035 · Design pass for undesigned screens** (owner: @vicentelyrio; no dependencies)
- [ ] Inbox, Stats, Tags, and the project Design view in Claude Design
- [ ] Settle what the project Design view shows (open question in DOC-00001)

**TASK-00036 · Editor component** (after TASK-00034)
- [ ] CodeMirror 6 with YAML frontmatter and Markdown modes
- [ ] Schema lint, wikilink autocomplete and decorations
- [ ] Git diff gutter (added, modified, deleted)
- [ ] Split view (source and rendered) and text-only view; "changed on disk" handling

**TASK-00037 · Goals overview and goal detail** (after TASK-00034)
- [ ] Goals grouped by `area` with progress rings; new goal
- [ ] Goal detail: horizon/due, progress, projects, focused graph

**TASK-00038 · Project board** (after TASK-00034)
- [ ] Kanban by configured states; drag to change state (dnd-kit)
- [ ] Cards: labels, assignees, checklist progress, "waiting on"
- [ ] Views: Tasks, Docs, Knowledge, Design (Design after TASK-00035)
- [ ] Mini graph

**TASK-00039 · Task drawer** (after TASK-00036, TASK-00038)
- [ ] Fields header (state, created, assignees, labels), decisions row with "Link ADR"
- [ ] Checklist toggles write back; related items

**TASK-00040 · Knowledge index** (after TASK-00034)
- [ ] Type tabs with counts; status, project and tag filters; stale and orphan toggles; sort
- [ ] Preview panel: summary, backlinks, co-changed files
- [ ] Empty state with starters and "Import from docs/"

**TASK-00041 · Doc view** (after TASK-00036)
- [ ] Doc: stale banner with "Review changes" and "Mark reviewed", commits since review
- [ ] ADR: supersession banner, lifecycle steps, supersession chain
- [ ] Context: include toggle, token budget bar, sync targets
- [ ] Side panel: backlinks, outgoing links, co-changed files

**TASK-00042 · Decision log** (after TASK-00034, TASK-00018)
- [ ] Lanes per project, status transitions, supersession links, project filter

**TASK-00043 · Graph view** (after TASK-00034)
- [ ] graphology + d3-force + SVG; typed node shapes and edge styles
- [ ] Hover tooltip, click to focus, legend toggles, zoom and fit
- [ ] Reusable embedded variant for goal and project pages

**TASK-00044 · Search palette** (after TASK-00034)
- [ ] Mantine Spotlight (⌘K) over ids, titles, paths and bodies; grouped by type; type chips
- [ ] Keyboard navigation; ↵ open, ⌘↵ open as split

**TASK-00045 · Inbox** (after TASK-00021, TASK-00035)
- [ ] Working-tree changes and agent activity since last visit (stored in `.netherite/local/`)
- [ ] Proposed ADRs, stale and drifting docs, orphans, lint errors, blocked tasks

**TASK-00046 · Stats** (after TASK-00018, TASK-00035)
- [ ] Progress per goal and project over time; tasks done per week; ADR activity

**TASK-00047 · Tags** (after TASK-00034, TASK-00035)
- [ ] All labels and tags with counts per type; rename across files (through core operations)

**TASK-00048 · App end-to-end tests** (after TASK-00039, TASK-00041)
- [ ] Playwright against a fixture repo: board drag, checklist toggle, mark reviewed, context toggle, search
- [ ] Assert the resulting file diffs

---

## GOAL-00003 · M3 Release

### PRJ-00008 · Release 2.0

**TASK-00049 · Package `netherite`** (after TASK-00030, TASK-00034)
- [ ] One published package: CLI, server, MCP and the bundled SPA
- [ ] `npx netherite` works in a clean repo on Linux and macOS; Windows smoke test

**TASK-00050 · Documentation** (after TASK-00049)
- [ ] README and getting started: `init`, agent MCP config, skills, `serve`
- [ ] Reference: schemas, CLI, MCP tools, config
- [ ] Obsidian compatibility notes

**TASK-00051 · Release** (after TASK-00048, TASK-00050)
- [ ] Changeset for 2.0.0; release workflow in GitHub Actions
- [ ] Merge `feat/v2` into `main`

## Risks

| Risk | Mitigation |
|---|---|
| Effect adds bundle size and a learning curve; `HttpApi` and `@effect/cli` are younger than Hono and commander | Pin exact versions; size budget in CI (TASK-00005); build the server vertical slice (TASK-00027) early and fall back to Hono only for the transport if blocked |
| Mantine defaults fight the custom design | Theme and `classNames` in TASK-00033 first; only `packages/ui` imports Mantine so a swap stays contained |
| Format-preserving edits are harder than expected (YAML edge cases) | TASK-00012 comes early with golden tests; fall back to rewriting only the frontmatter block, never the body |
| Git history queries are slow on large repos | Cache per `HEAD`; limit history depth for stats; measure in TASK-00018 |
| MCP tool surface is awkward for agents | TASK-00025 dogfoods it before the UI exists; adjust tools then |
| Undesigned screens block M2 | TASK-00035 has no dependencies and can start now |
