---
id: TASK-00082
aliases: [TASK-00082]
type: task
title: "Components: extract the shared pieces"
created: 2026-11-02T20:29:59Z
created_by: "@vicentelyrio"
project: PRJ-00013
state: done
depends_on: [TASK-00079]
---

# Components: extract the shared pieces

- [x] Inventory repeated widgets in pages (tags, bars, tabs, tables, panels, crumbs, kbd) and list them here
- [x] Move generic primitives to `packages/ui`, app-specific ones to `components/`
- [x] Each component gets its own CSS file and a test
- [x] Remove the copies from pages

## Progress

Extracted, each with CSS and a test: ProgressBar, TagList, TitleForm, TextField, SearchField, SelectField, FilterTabs, Breadcrumbs, StatCard, GroupCard. Pages use them and the old rules are out of app.css.

Item-specific pieces (Highlight, freshness cell, row variants, link list) and the Box/Group/Stack pass move to [[TASK-00083]], where the features that own them are split out.
