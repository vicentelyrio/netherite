---
id: TASK-00112
aliases: [TASK-00112]
type: task
title: Move between page sections
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
depends_on: [TASK-00107]
related: [DOC-00003]
---

# Move between page sections

Give every page sections such as header and content, declared once in the templates, and keys to go between them.

## Checklist

- [ ] Page, split, board, card grid, columns and canvas templates all declare their sections
- [ ] A guard test fails if a template has no sections
- [ ] `.` goes to the next section and `,` to the previous, wrapping inside the page without reaching the sidebar
- [ ] `F6` and `shift+F6` do the same and also work while typing
- [ ] The focused section is visibly marked in every theme
- [ ] The tab order and mouse behaviour do not change
- [ ] An e2e test goes through the sections of two different page templates

## Notes
