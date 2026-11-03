---
id: TASK-00083
aliases: [TASK-00083]
type: task
title: "Features: split screens by entity"
created: 2026-11-02T20:29:59Z
created_by: "@vicentelyrio"
project: PRJ-00013
state: doing
depends_on: [TASK-00080, TASK-00081, TASK-00082]
---

# Features: split screens by entity

- [x] Goals: GoalCard, GoalList, GoalDetailHeader
- [x] Projects: ProjectCard, TaskBoard, TaskCard, ProjectKnowledgeTable
- [ ] Task: TaskDrawerContent, Checklist
- [x] Knowledge: KnowledgeTable, KnowledgePreview, DocSidebar, AdrLifecycle, DecisionLanes
- [x] Graph: GraphPanel, GraphLegend; Editor: SourceEditor wrapper
- [x] Inbox: InboxList, InboxPreview; Tags: TagMap, TagList, TagPanel; Stats: KpiRow, Throughput, HeatMap
- [x] Search: SearchPalette results

## From TASK-00082

- [ ] Highlight (search), freshness cell, row variants (inbox, knowledge, tags) and link list move into the features that use them
- [ ] Use Box, Group and Stack from @netherite/ui for spacing and alignment in components and features

## Progress

Done: every screen is a feature plus a thin page: goals, projects, knowledge, decisions, inbox, tags, stats, graph, search, item, and the shell (features/navigation). GraphView, the charts and the CodeMirror editor are shared components. Nothing is left in src outside the five layers except app.css (183 lines) and the router.

Left: splitting TaskDrawer (features/tasks) into TaskDrawerContent, Checklist and its field cells; the project knowledge table is a round 2 design item (TASK-00073). app.css goes under TASK-00085.
