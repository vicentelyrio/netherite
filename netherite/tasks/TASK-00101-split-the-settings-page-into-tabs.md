---
id: TASK-00101
aliases: [TASK-00101]
type: task
title: Split the Settings page into tabs
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: done
position: 48.125
---

# Split the Settings page into tabs

Move the Settings page to tabs so it has room to grow: General, Editor, Shortcuts and Workspace. Tabs with nothing in them yet stay hidden until their task adds content.

## Checklist

- [x] Editor settings and keyboard shortcuts each sit in their own tab
- [x] The open tab is in the URL, so a reload or a shared link keeps it
- [x] Tabs work by keyboard and are named for screen readers
- [x] `go.settings` and the rail still reach the page
- [x] Existing settings end-to-end tests pass, updated for the tabs

## Notes

Awaiting review. The tabs are Editor and Shortcuts; General and Workspace appear when [[TASK-00102]] and [[TASK-00103]] give them content.

- Tab changes replace the history entry, so Back leaves Settings rather than stepping through tabs.
- TanStack merges raw search params over what `validateSearch` returns, so an invalid value has to be overwritten with `undefined`. Other routes that return `{}` for a bad value keep it.
