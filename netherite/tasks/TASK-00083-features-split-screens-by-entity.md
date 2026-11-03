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
- [ ] Graph: GraphPanel, GraphLegend; Editor: SourceEditor wrapper
- [x] Inbox: InboxList, InboxPreview; Tags: TagMap, TagList, TagPanel; Stats: KpiRow, Throughput, HeatMap
- [ ] Search: SearchPalette results

## From TASK-00082

- [ ] Highlight (search), freshness cell, row variants (inbox, knowledge, tags) and link list move into the features that use them
- [ ] Use Box, Group and Stack from @netherite/ui for spacing and alignment in components and features

## Progress

Done: goals, projects, knowledge (index, doc view, decision log), inbox, tags, stats and the graph page, each as features/<name> plus pages/<name>. GraphView and the charts are now shared components. TaskDrawer moved to features/tasks and SourceEditor to features/editor, both still one file each: splitting the drawer into TaskDrawerContent, Checklist and its field cells is left. The project knowledge table is a round 2 design item (TASK-00073).

Left: the search palette (src/search.tsx), the shell (src/shell.tsx), the item page (pages/item.tsx) and the CodeMirror editor (src/editor).
