---
id: TASK-00107
aliases: [TASK-00107]
type: task
title: One shortcut dispatcher with app, page and overlay scopes
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
related: [DOC-00003]
---

# One shortcut dispatcher with app, page and overlay scopes

Every `useShortcuts` call adds its own window listener, so nothing knows which shortcuts are active or whether an overlay is open. Everything else in the project needs one place that decides.

## Checklist

- [ ] One key listener handles every shortcut, and `useShortcuts` registers with it instead of adding its own
- [ ] Active scopes form a stack of app, page and overlay, and the topmost that has the key wins
- [ ] While a drawer or modal is open, the page's keys do not fire
- [ ] Plain keys stay off inside inputs and the editor, and Vim mode behaves as before
- [ ] Existing shortcut unit tests and `shortcuts.spec.ts` pass without changes

## Notes
