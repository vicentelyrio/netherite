---
id: TASK-00085
aliases: [TASK-00085]
type: task
title: Retire app.css and move the tests
created: 2026-11-02T20:29:59Z
created_by: "@vicentelyrio"
project: PRJ-00013
state: doing
depends_on: [TASK-00084]
---

# Retire app.css and move the tests

- [x] Move every rule from `app.css` to the CSS of its component, feature or template; delete the file
- [x] Tests next to their code; update `test/helpers` and the e2e imports
- [ ] lint, typecheck, build, unit and e2e green; screenshot check against the designs

## Progress

app.css is gone and the unit tests sit next to their code (only the app integration tests, helpers and setup stay in test/). Left: the screenshot check of every screen against the designs, run while testing the app.
