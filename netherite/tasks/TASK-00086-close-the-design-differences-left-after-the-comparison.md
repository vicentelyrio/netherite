---
id: TASK-00086
aliases: [TASK-00086]
type: task
title: Close the design differences left after the comparison
created: 2026-11-03T23:14:37Z
created_by: "@vicentelyrio"
project: PRJ-00012
state: backlog
---

# Close the design differences left after the comparison

- [x] Stats: "Commits linked to work" as a percentage, which needs commits tied to tasks
- [x] Doc view: boxed Decision and two-column Consequences for ADRs, and the "M N lines changed" badge in the top bar
- [x] Knowledge index: avatar in the modified column and the AI-context chip with its token count
- [x] Project board: the Knowledge view's "Linked to" text ("Explains 2 tasks"), which needs the kind of link in the knowledge list; the filter chips and the column header (icon, name, count) are done
- [x] Goals overview: the area description line (a summary of its goals, projects and progress, since an area has no text of its own); breadcrumb with the area on the board and goal pages
- [x] Tags: decide whether the All / Tags / Labels tabs stay, since the design has none: they stay, because tags and labels are different fields and renaming one must not touch the other
- [ ] Compare Search and Goal detail by eye against the design frames, and Graph and the token sheets
- [x] Check every screen at 1280 and 1440: no screen scrolls sideways at either width (measured in headless Chrome); not compared with the design frames

Source: the findings in TASK-00078.
- [x] Breadcrumbs: the area on the goal page links to Goals filtered to that area, and the folder in the doc view to Knowledge filtered by that folder
- [x] Project board: with the task drawer open, the board keeps clear of it, so no card sits underneath
