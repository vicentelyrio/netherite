---
id: TASK-00113
aliases: [TASK-00113]
type: task
title: Jump between the sidebar and the page
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
depends_on: [TASK-00112]
related: [DOC-00003]
---

# Jump between the sidebar and the page

`;` moves focus between the sidebar and the page, without stepping through the page's sections.

## Checklist

- [ ] `;` from the page focuses the sidebar item of the current page
- [ ] `;` from the sidebar returns to the section left, or to the content section if there is none
- [ ] `j` `k` and the arrows move between sidebar items
- [ ] `Enter` opens the page and focus lands in its content section
- [ ] An e2e test goes from content to sidebar, opens another page and lands in its content

## Notes
