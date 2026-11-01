---
id: TASK-00007
aliases: [TASK-00007]
type: task
title: Workspace discovery and config loading
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00002
state: done
depends_on: [TASK-00006]
---

# Workspace discovery and config loading

- [x] Walk up from the current directory to `.netherite/config.yml`
- [x] Defaults, merging, validation errors with file and line
- [x] Use the platform `FileSystem` service, with an in-memory layer for tests
