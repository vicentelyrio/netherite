---
id: TASK-00027
aliases: [TASK-00027]
type: task
title: Effect HttpApi server
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00005
state: done
depends_on: [TASK-00013]
related: [ADR-00019]
---

# Effect HttpApi server

- [x] Read endpoints: items, item, search, graph, lint, inbox data, history and stats
- [x] Write endpoints mapped to core operations, with hash-based conflicts returned as 409
- [x] API defined once with Effect Schema; typed `HttpApiClient` exported for the app
- [x] Tagged errors mapped to statuses (422 validation, 409 conflict, 404 not found)
