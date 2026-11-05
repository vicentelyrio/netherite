---
id: TASK-00057
aliases: [TASK-00057]
type: task
title: Lifecycle events from git history
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00009
state: done
depends_on: [TASK-00056]
---

# Lifecycle events from git history

- [x] Event extraction per item: state, status, due changes with commit and date
- [x] Task and project lifecycle: created, started, held, done, reopened, waiting time
- [x] ADR lifecycle: proposed, accepted, deprecated, superseded
- [x] Fallback for shallow or untracked history, with a flag the UI can show
- [x] Cache by head commit; invalidate on SSE
- [x] Tests on a fixture repo with a scripted history
