---
id: ADR-00011
aliases: [ADR-00011]
type: adr
title: Frontend stack with Mantine, as a Vite single-page app
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [frontend, ui, mantine]
---

# Frontend stack with Mantine, as a Vite single-page app

## Context

The "Netherite Refined" design is a dense, custom dark UI: kanban with drag and drop, a split Markdown/YAML editor with lint and a diff gutter, an interactive typed graph, a command palette. v1 used Emotion. Building every component from headless primitives is a lot of work. Mantine 7+ is CSS-based (no runtime CSS-in-JS) and fully themeable through CSS variables and `createTheme`, so its visual opinions can be overridden.

Next.js in static export mode was also considered ([[ADR-00010]] serves the built app from the local server).

## Decision

> | Concern | Choice |
> |---|---|
> | Framework | React 19 + Vite, single-page app |
> | Routing and data | TanStack Router, TanStack Query (invalidated by SSE events), calling the typed Effect `HttpApiClient` ([[ADR-00010]]) |
> | Components | **Mantine** (`@mantine/core`, `hooks`, `notifications`, `spotlight`, `charts` for Stats) |
> | Theming | `packages/tokens` generates the Mantine theme (`createTheme`) and CSS variables, so token values map one to one |
> | Custom styling | CSS Modules over the same CSS variables. No runtime CSS-in-JS. |
> | Netherite components | `packages/ui` wraps Mantine and adds domain components: TypeBadge, StatusPill, FreshnessLabel, Rail, graph and editor shells |
> | Editor | CodeMirror 6: YAML and Markdown modes, lint from the schema, wikilink autocomplete and decorations, git diff gutter |
> | Markdown rendering | unified (remark-gfm, wikilink plugin, rehype) to React via `hast-util-to-jsx-runtime`; the parser plugins are shared with `core` |
> | Command palette | Mantine Spotlight |
> | Drag and drop | dnd-kit |
> | Graph | graphology model, d3-force layout, SVG rendering (move to canvas or sigma.js above ~2,000 visible nodes) |
> | Icons and fonts | Material Symbols Rounded, Source Sans 3 and Source Code Pro, all self-hosted (works offline) |
>
> ### Why not Next.js static export
>
> - All data is runtime data from the local server. Routes such as `/items/TASK-00042` cannot be known at build time, so `generateStaticParams` is useless and the app would be a client-side SPA inside Next anyway.
> - No server components, route handlers, middleware or image optimisation can be used in `output: "export"`. The local server is the backend ([[ADR-00010]]).
> - The Next dev server and build add weight and slower rebuilds for no feature the app can use. Vite keeps the bundled package small.
> - Revisit if the app ever needs server rendering (for example a hosted read-only viewer).

## Consequences

- \+ Far fewer components to build: modals, drawers, menus, tabs, tooltips, spotlight and notifications come ready and accessible.
- \+ Token values still map onto CSS variables, via the generated theme.
- − Visual fidelity to the design needs theme and `classNames` overrides; some Mantine defaults will be fought component by component.
- − Larger dependency surface than headless primitives; `packages/ui` is the only place allowed to import Mantine directly, to keep a later swap contained.
