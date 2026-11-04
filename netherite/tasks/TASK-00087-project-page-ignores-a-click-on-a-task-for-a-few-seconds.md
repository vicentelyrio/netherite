---
id: TASK-00087
aliases: [TASK-00087]
type: task
title: Project page ignores a click on a task for a few seconds after a reload
created: 2026-11-03T23:46:13Z
created_by: "@vicentelyrio"
project: PRJ-00012
state: backlog
---

# Project page ignores a click on a task for a few seconds after a reload

- [ ] Reproduce it in the person's browser: after a reload of `/projects/PRJ-…`, does the URL change on the first click, does the drawer open, and are requests pending in the Network tab
- [ ] Find the cause and fix it, with a test
- [ ] Check whether several open tabs matter: each tab holds one live event stream, and a browser allows six connections per host

Not reproduced in headless Chrome: after a reload the first card click changed the URL and opened the drawer in about 0.8s, with no main-thread stall over 60ms and no slow request, on a cold server and a warm one. One real cause was found and fixed on the way: with the task drawer open, its dim overlay took the first click and only closed the drawer.
