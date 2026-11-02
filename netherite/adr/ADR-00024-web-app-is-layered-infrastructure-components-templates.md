---
id: ADR-00024
aliases: [ADR-00024]
type: adr
title: "Web app is layered: infrastructure, components, templates, features, pages"
created: 2026-11-02T20:29:59Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-02
deciders: ["@vicentelyrio"]
project: PRJ-00013
---

# Web app is layered: infrastructure, components, templates, features, pages

## Context

`apps/web/src` grew by screen: `pages/` holds 3,000+ lines of screens that mix data fetching, layout and small widgets, one 2,948-line `app.css` styles everything, and helpers sit in `lib/`. The same pieces (tag chips, progress bars, grouped tables, filter tabs, side panels, crumbs) are re-implemented per screen. The redesign (round 2) repeats the same page anatomy on every screen: a 64px rail, a header, then a main area and often a side panel.

## Decision

`apps/web/src` has five layers. A layer may import only from layers below it in this list, never up or across a sibling feature or page.

1. **infrastructure/** (bottom): what every layer needs and that is not UI. API client and app context, TanStack Query keys and queries, live updates (SSE), notices, config and settings contexts (shortcuts, preferences), i18n (message catalog and `t()`; English only for now, but no user-facing string is hard-coded in a component), datetime (one place that formats absolute, relative and range dates, with the clock injectable for tests).
2. **components/**: small, app-specific, presentational pieces built on `@netherite/ui`: TagList, ProgressBar, SectionHeader, GroupedTable, FilterTabs, SearchField, Kbd, StatCard, Toolbar, EmptyPanel, Crumbs. They take props, hold no server state, and each has its own CSS file next to it.
3. **templates/**: page shells on a column grid (below). A template has named slots and no content.
4. **features/**: a component that does a job for one entity, with its data hook: GoalList, ProjectBoard, TaskDrawerContent, KnowledgeTable, KnowledgePreview, DecisionLanes, GraphPanel, InboxList, TagMap, KpiRow, ThroughputChart, SearchResults. A feature fetches, shows loading, empty and error states, and uses components.
5. **pages/** (top): a module per route that places features into a template's slots. A page has no styling of its own, no fetching, and ideally under 60 lines. The router imports pages only.

**Column grids.** One 12-column grid, defined as tokens (`grid-columns`, `grid-gutter`, `grid-margin`, rail width) in `packages/tokens`, drives every template, so the content from the designs falls on columns instead of fixed pixels. Templates: `AppShell` (rail and outlet), `PageTemplate` (header, optional toolbar, body), `SplitTemplate` (main 8 and side 4, for Knowledge, Tags, Inbox), `BoardTemplate` (side 3 and main 9, for the project board), `CardGridTemplate` (3 equal areas, for Goals), `CanvasTemplate` (full-bleed canvas with overlay slots, for Graph and Timeline), `DrawerTemplate` (header, body, footer for task and document drawers).

**Where Mantine lives.** Unchanged from the Mantine decision: only `packages/ui` imports `@mantine/*`. Generic primitives (button, badge, pill, tabs, tooltip, table row) go to `packages/ui`; `apps/web/src/components` composes them for Netherite's needs. If this proves too indirect, a later ADR can supersede that boundary; this one does not.

**Rules enforced.** Biome `noRestrictedImports` per folder encodes the import direction. Tests live next to the code (`*.test.tsx`). CSS is co-located; global CSS only holds resets and tokens, and `app.css` is deleted when its last rule moves.

## Consequences

- \+ A screen is assembled, not written; round 2 designs reuse components.
- \+ Layout is consistent because it comes from one grid.
- \+ Each layer is testable on its own: components by props, features by mocked API, pages by route.
- \- A one-off refactor of about 9,700 lines with the whole test suite as the safety net.
- \- More files and indirection; the layer rules must be kept honest by lint, not by memory.
- \- Some pieces (GraphView, ItemEditor) are big and will move first and be split later.
