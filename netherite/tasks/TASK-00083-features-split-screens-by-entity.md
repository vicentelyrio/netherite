---
id: TASK-00083
aliases: [TASK-00083]
type: task
title: "Features: split screens by entity"
created: 2026-11-02T20:29:59Z
created_by: "@vicentelyrio"
project: PRJ-00013
state: done
depends_on: [TASK-00080, TASK-00081, TASK-00082]
---

# Features: split screens by entity

- [x] Goals: GoalCard, GoalList, GoalDetailHeader
- [x] Projects: ProjectCard, TaskBoard, TaskCard, ProjectKnowledgeTable
- [x] Task: TaskDrawerContent, Checklist
- [x] Knowledge: KnowledgeTable, KnowledgePreview, DocSidebar, AdrLifecycle, DecisionLanes
- [x] Graph: GraphPanel, GraphLegend; Editor: SourceEditor wrapper
- [x] Inbox: InboxList, InboxPreview; Tags: TagMap, TagList, TagPanel; Stats: KpiRow, Throughput, HeatMap
- [x] Search: SearchPalette results

## From TASK-00082

- [ ] Highlight (search), freshness cell, row variants (inbox, knowledge, tags) and link list move into the features that use them
- [ ] Use Box, Group and Stack from @netherite/ui for spacing and alignment in components and features

## Progress

Done. Every screen is a feature plus a thin page; the task drawer is split into TaskContent, TaskFields, TaskDecisions, TaskChecklist and TaskRelated. The project knowledge table is a round 2 design item (TASK-00073).
