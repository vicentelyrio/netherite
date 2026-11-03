---
id: TASK-00063
aliases: [TASK-00063]
type: task
title: "Graph: status, legend panel and tooltips"
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00010
state: done
depends_on: [TASK-00062]
---

# Graph: status, legend panel and tooltips

- [x] Node fill, halo and done opacity from the status components
- [x] Legend panel: nodes, edges and status columns, toggles with counts, All / Open / Done filter
- [x] Stale dot on docs; tooltip with kind, parent, status since date and link count
- [x] Zoom in, out and fit controls; hover and focus dimming as designed
- [x] Keep node drag, pan and zoom that already work

## Progress

Engine: graph nodes now carry status (backlog, progress, hold, done), progress (0 to 1), parent and stale (core graphOf, API GraphNode, the graph endpoint passes freshness). App: StatusShape in GraphView (pie, halo, hold ring, done check at 0.8), a stale dot on docs, a Status column in the legend panel with counts and an All / Open / Done filter that fades the rest, status and percent in the tooltip.

Left in the item that is ticked only in part: the tooltip does not say since when a node has had its status, because that needs the lifecycle events of TASK-00057. The Stale doc legend row is there; no doc is stale in this repo, so the dot has not been seen on screen.
