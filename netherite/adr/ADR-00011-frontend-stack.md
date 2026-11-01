---
id: ADR-00011
aliases: [ADR-00011]
type: adr
title: Frontend stack
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [frontend, ui]
---

# Frontend stack

## Context

The "Netherite Refined" design is a dense, custom dark UI: kanban with drag and drop, a split Markdown/YAML editor with lint and a diff gutter, an interactive typed graph, a command palette. v1 used Emotion.

## Decision

| Concern | Choice |
|---|---|
| Framework | React 19 + Vite |
| Routing and data | TanStack Router, TanStack Query (invalidated by SSE events) |
| Styling | CSS Modules over CSS variables from `packages/tokens`. No runtime CSS-in-JS. |
| Behaviour primitives | Base UI (headless: dialog, menu, popover, switch, tabs, tooltip) |
| Editor | CodeMirror 6: YAML and Markdown modes, lint from the schema, wikilink autocomplete and decorations, git diff gutter |
| Markdown rendering | unified (remark-gfm, wikilink plugin, rehype) to React via `hast-util-to-jsx-runtime`; the parser plugins are shared with `core` |
| Command palette | cmdk |
| Drag and drop | dnd-kit |
| Graph | graphology model, d3-force layout, SVG rendering (move to canvas or sigma.js above ~2,000 visible nodes) |
| Icons and fonts | Material Symbols Rounded, Source Sans 3 and Source Code Pro, all self-hosted (works offline) |

Mantine (used in attic) was rejected because its own visual opinions would fight the custom design.

## Consequences

- \+ Token values in the design map one to one onto CSS variables.
- \+ Lighter bundle than Monaco plus a component kit.
- − More components to build ourselves in `packages/ui`.
