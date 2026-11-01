---
id: TASK-00011
aliases: [TASK-00011]
type: task
title: Lint rules
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00002
state: done
depends_on: [TASK-00010]
---

# Lint rules

- [x] Schema errors; broken and ambiguous links; duplicate IDs
- [x] Missing ID in `aliases`; file outside its type folder; file name not matching the ID
- [x] Orphans (info); unknown fields (info)
- [x] Machine-readable result: path, line, column, rule, severity, message
- [x] Fixable rules (missing ID in `aliases`, file name not matching the ID, renamed fields after a schema change) return a fix as a core operation; applying it is covered by [[TASK-00019]] `--fix`
