---
id: TASK-00112
aliases: [TASK-00112]
type: task
title: Move between page sections
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: done
decisions: [ADR-00033]
depends_on: [TASK-00107]
related: [DOC-00003]
---

# Move between page sections

Give every page sections such as header and content, declared once in the templates, and keys to go between them.

## Checklist

- [x] Page, split, board, card grid, columns and canvas templates all declare their sections
- [x] A guard test fails if a template has no sections
- [x] `.` goes to the next section and `,` to the previous, wrapping inside the page without reaching the sidebar
- [x] `F6` and `shift+F6` do the same and also work while typing
- [x] The focused section is visibly marked in every theme
- [x] The tab order and mouse behaviour do not change
- [x] An e2e test goes through the sections of two different page templates

## Notes

`F6` is tested as it reaches the page. Whether a browser hands it to the page or keeps it for its address bar was not checked outside Playwright, so `.` and `,` are the keys to rely on. The ring was checked by screenshot in the default dark theme and Netherite Light; it uses theme tokens only.
