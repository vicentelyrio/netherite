---
id: TASK-00114
aliases: [TASK-00114]
type: task
title: Move inside a section, and climb out with Esc
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
depends_on: [TASK-00112]
related: [DOC-00003]
---

# Move inside a section, and climb out with Esc

Once a section has focus, the same keys move through its items, and `Esc` always goes one level up.

## Checklist

- [ ] `j` `k` and the arrows move between the items of the focused section
- [ ] `Enter` opens the focused item
- [ ] `Esc` in an input moves focus to its section, and `Esc` in a drawer's content closes the drawer
- [ ] With Vim mode on, `Esc` in the editor stays in the editor
- [ ] In the Inbox, `j` and `k` keep moving to the next and previous item
- [ ] Inputs that already handle `Esc` themselves, such as the tags filter, keep working

## Notes
