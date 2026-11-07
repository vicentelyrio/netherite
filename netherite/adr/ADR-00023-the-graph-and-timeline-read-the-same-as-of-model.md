---
id: ADR-00023
aliases: [ADR-00023]
type: adr
title: The graph and Timeline read the same as-of model
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-02
deciders: ["@vicentelyrio"]
project: PRJ-00007
---

# The graph and Timeline read the same as-of model

## Context

The graph gets a time scrubber (drag or play to watch the workspace grow) and the Timeline shows projects, tasks and decisions on one axis. Both need the state of the workspace at any date.

## Decision

> One endpoint family serves both, built on the lifecycle events of [[ADR-00020]]:
>
> - `GET /graph?asOf=YYYY-MM-DD` returns only items that existed on that date, each with its state, pie progress and stale flag as of then; supersession edges appear from the date the successor was accepted.
> - `GET /timeline?from&to` returns, per goal and project, its span, holds, due and milestone; per task its created, started, done, held and due dates; per ADR its proposed and decided dates; and commits per week for the activity strip.
> - Both are cached by the head commit and invalidated over SSE like every other read model.
> - The graph scrubber's activity histogram is the same weekly series.

## Consequences

- \+ One definition of "what was true on date D", tested once.
- \+ The scrubber and the Timeline stay consistent with Stats.
- \- A far date on a big repo replays many events; the cache and a coarse step (days, not commits) keep that bounded.
