---
id: TASK-00114
aliases: [TASK-00114]
type: task
title: Move inside a section, and climb out with Esc
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: done
decisions: [ADR-00033]
depends_on: [TASK-00112]
related: [DOC-00003]
---

# Move inside a section, and climb out with Esc

Once a section has focus, the same keys move through its items, and `Esc` always goes one level up.

## Checklist

- [x] `j` `k` and the arrows move between the items of the focused section
- [x] `Enter` opens the focused item
- [x] `Esc` in an input moves focus to its section, and `Esc` in a drawer's content closes the drawer
- [x] With Vim mode on, `Esc` in the editor stays in the editor
- [x] In the Inbox, `j` and `k` keep moving to the next and previous item
- [x] Inputs that already handle `Esc` themselves, such as the tags filter, keep working

## Notes

`Enter` no longer starts a keyboard drag on a card, so it can open the card. `Space` still does. The task drawer closes through the shortcut dispatcher, not Mantine, so `Esc` can leave a field first.
