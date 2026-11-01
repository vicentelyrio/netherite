---
id: TASK-00010
aliases: [TASK-00010]
type: task
title: Index and graph
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00002
state: done
depends_on: [TASK-00009]
---

# Index and graph

- [x] Item index with derived values (progress, backlinks, orphan flag)
- [x] graphology graph with the typed edges from [[ADR-00003]] plus references
- [x] MiniSearch index (id and title boosted)
- [x] Incremental update API (add, change, remove a path)
- [x] Benchmark: 5,000 generated files indexed in under 2 s
