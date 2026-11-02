---
id: TASK-00080
aliases: [TASK-00080]
type: task
title: "Infrastructure: move and add"
created: 2026-11-02T20:29:59Z
created_by: "@vicentelyrio"
project: PRJ-00013
state: doing
depends_on: [TASK-00079]
---

# Infrastructure: move and add

- [x] Move `lib/api`, `app-context`, `queries`, `live`, `writes`, `notices`, `config` to `infrastructure/`
- [ ] i18n: message catalog and `t()`; move every user-facing string out of components
- [x] datetime: absolute, relative and range formatters with an injectable clock; replace ad-hoc date code
- [x] Settings and shortcuts context on top of `packages/ui` shortcuts
