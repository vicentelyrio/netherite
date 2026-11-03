---
id: TASK-00068
aliases: [TASK-00068]
type: task
title: "Inbox: triage screen"
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00011
state: doing
depends_on: [TASK-00067]
---

# Inbox: triage screen

- [x] Capture box appends to `inbox.md`; groups Captured, Needs review, From commits with counts and tabs
- [ ] Preview pane: turn a capture into task, doc, ADR, runbook or context with suggested project, goal, tags and the file and frontmatter it will write
- [x] Primary action per raised item (Mark reviewed, Accept, Link, Move due, Mark task done, Make task, Merge tags)
- [x] Archive (E), snooze (H), J/K move; toast with Undo (no commit: the app only changes files)
- [x] Inbox zero state with the snoozed count
- [x] Dropped: no commit, so no revert commit; the developer commits and reverts with git (ADR-00022)
