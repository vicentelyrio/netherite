---
id: TASK-00064
aliases: [TASK-00064]
type: task
title: Graph time scrubber
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00010
state: backlog
depends_on: [TASK-00058, TASK-00063]
---

# Graph time scrubber

- [ ] Scrubber with activity histogram, date readout, play and pause, Today button
- [ ] Reads `GET /graph?asOf=`; nodes appear as they were created; recent events glow
- [ ] Playback steps by days without refetching on every frame (prefetch a range)
- [ ] e2e: scrub to a past date, graph shows fewer nodes; Today restores
