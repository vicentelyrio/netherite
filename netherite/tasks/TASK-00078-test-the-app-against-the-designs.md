---
id: TASK-00078
aliases: [TASK-00078]
type: task
title: Test the app against the designs
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00012
state: doing
depends_on: [TASK-00062, TASK-00065, TASK-00068, TASK-00070, TASK-00071, TASK-00072, TASK-00073, TASK-00074, TASK-00075, TASK-00076, TASK-00077]
---

# Test the app against the designs

- [ ] Run through each screen at 1920x1080 beside Claude Design and list the differences as tasks
- [x] Check keyboard shortcuts, empty states and error states on every screen
- [x] Check progression with a real history: Timeline, scrubber, Stats and Inbox on this repo
- [ ] Record findings here; open a task per defect

## Findings

Real history, this repo, 1920x1080 (3 Nov 2026):

- Inbox: 6 proposed decisions list and triage fine. From commits is 0 because no commit message here says "closes TASK-N", so the rule has nothing to match.
- Timeline: the Today pill covers the 3 Nov axis label. Tasks done today show as slivers at the Today line, which is true to the history.
- Stats: Goal areas shows a bare dash for the no-area group, it should read "No area". Tasks created and done has no x axis labels. Knowledge health shows 2 not tracked and 0 fresh because no doc has `covers` set.
- Goals have no `area` or `horizon`, so the goals overview has one column.

Fixed in the app: Today pill no longer covers the nearest axis label, the no-area group reads "No area", and the created and done chart has week labels.

Shortcuts and states (read from the code and the tests): every screen has a load error state except Search, where a failed request said "No results". Fixed: it now shows "Could not search". Empty states exist on Inbox, Knowledge, Goals, Projects, Decisions, Tags, Stats, Timeline, Graph and Search.
