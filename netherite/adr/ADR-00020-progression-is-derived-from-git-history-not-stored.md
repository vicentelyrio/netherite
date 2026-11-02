---
id: ADR-00020
aliases: [ADR-00020]
type: adr
title: Progression is derived from git history, not stored
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
status: proposed
date: 2026-11-02
deciders: ["@vicentelyrio"]
project: PRJ-00007
---

# Progression is derived from git history, not stored

## Context

The redesign (Claude Design, turn 4) shows how work *progresses*: a task has a life (created, started, on hold, done, overdue), a project has a span with holds and a due date, a decision goes from proposed to accepted. The Timeline, the graph scrubber and Stats all read from that life. Nothing in the item frontmatter records it today: a task has `state`, `created` and an optional `due`.

Storing event dates in frontmatter (`started_at`, `done_at`, `held_since`) would duplicate what git already knows, and it would drift when someone edits state by hand or in another tool. [[ADR-00007]] already makes git the source for history; [[ADR-00009]] already derives freshness from it.

## Decision

Progression is a read model computed from the history of each item's file. Nothing about it is stored.

- A **lifecycle event** is one commit that changed a tracked field: `state` (to a state of category active, blocked or done), `status` of a project or ADR, `due`. Each carries the item ID, the field, the old and new value, the commit and its date.
- For a task: *created* = first commit that has the file (frontmatter `created` wins when earlier); *started* = first move into an active state; *held* = move into a blocked state, until the next move out of it; *done* = last move into a done state, cleared if it later reopens; *waiting time* = created to started.
- For a project: *start* = its created date; *holds* = spans where the project status is not `active`; *done* = move to a done status. `due`, and a milestone label, are frontmatter, because they are intent and not history.
- For an ADR: *proposed* and *accepted* (or deprecated, superseded) are the dates of the commits that set `status`.
- The same events answer "as of date D": replay them up to D to get every item's state at D.
- Items with no history (untracked files, a fresh clone with a shallow history) fall back to `created` and the current state, and the UI shows what is missing instead of inventing dates.

## Consequences

- \+ One source of truth; a hand edit, an agent and the app all produce the same progression.
- \+ Works on any existing repo with no migration.
- \+ Time travel for the graph and Timeline comes for free from the same events.
- \- Needs git history; a squashed or shallow repo shows coarse progression.
- \- State names are workspace configuration, so mapping a state to *started* or *held* uses its category, and a state with no category counts as active.
- \- Computing from `git log` per item must be cached (see [[ADR-00014]]) to stay fast on large repos.
