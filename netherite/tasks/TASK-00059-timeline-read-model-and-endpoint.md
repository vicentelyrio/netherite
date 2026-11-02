---
id: TASK-00059
aliases: [TASK-00059]
type: task
title: Timeline read model and endpoint
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00009
state: backlog
depends_on: [TASK-00057]
---

# Timeline read model and endpoint

- [ ] `GET /timeline?from&to`: goals, projects (span, holds, due, milestone), tasks (created, started, done, held, due), ADR spans
- [ ] Weekly commit counts for the activity strip
- [ ] Overdue and planned flags computed server-side from today
- [ ] API schema in `packages/api`, handler in `packages/server`, client query
