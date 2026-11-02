---
id: ADR-00021
aliases: [ADR-00021]
type: adr
title: Status is encoded by fill, hue stays type
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
status: proposed
date: 2026-11-02
deciders: ["@vicentelyrio"]
project: PRJ-00007
---

# Status is encoded by fill, hue stays type

## Context

[[DOC-00001]] gives every item type a hue and a shape (goal, project and task circles, ADR diamond, doc square, context ring, runbook bar). The redesign adds status (backlog, in progress, on hold, done) to goals, projects and tasks, on cards, in the graph, on the board and in the Timeline. If status also used hue, type and status would fight for the same channel.

## Decision

Hue means type, always. Status uses fill, ring and halo, in one component set shared by every screen.

- Progress: a conic pie inside the glyph, filled to the share done (tasks: checklist; projects and goals: tasks done).
- In progress: a halo ring one step outside the glyph.
- On hold: a grey pie fill and a dashed ring.
- Done: a solid fill with a check, drawn at 80% opacity in the graph.
- Backlog: an empty pie on the ring.
- ADRs keep their diamond: filled when in force, hollow with a struck title when superseded; lifecycle colours (proposed lavender, accepted green, deprecated red, superseded grey) apply only to pills, not to the glyph.
- Freshness stays a separate channel: dot, ring or warning icon.
- The components live in `packages/ui` with tokens in `packages/tokens` (`status-*`, `type-*`) so graph, board, drawer and Timeline cannot disagree.

## Consequences

- \+ A glance tells type (shape and hue) and status (fill) apart, in colour-blind modes too.
- \+ One implementation to test and to restyle.
- \- The graph needs a node renderer that can draw a conic pie, a halo and a ring at several sizes.
- \- Small nodes (task size 6) have little room; the pie reads as filled or empty there and the tooltip carries the detail.
