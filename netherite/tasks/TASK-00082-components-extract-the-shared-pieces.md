---
id: TASK-00082
aliases: [TASK-00082]
type: task
title: "Components: extract the shared pieces"
created: 2026-11-02T20:29:59Z
created_by: "@vicentelyrio"
project: PRJ-00013
state: doing
depends_on: [TASK-00079]
---

# Components: extract the shared pieces

- [x] Inventory repeated widgets in pages (tags, bars, tabs, tables, panels, crumbs, kbd) and list them here
- [ ] Move generic primitives to `packages/ui`, app-specific ones to `components/`
- [ ] Each component gets its own CSS file and a test
- [ ] Remove the copies from pages

## Progress

Extracted, each with CSS and a test: ProgressBar, TagList, TitleForm, Breadcrumbs, StatCard, GroupCard (the last in use by inbox, knowledge and tags).

Still to extract: Highlight (search), filter tabs and chips (knowledge, tags, search), FreshnessCell, ItemRow/Row variants, LinkList, search field; plain divs to Box, Group, Stack.
