---
id: TASK-00111
aliases: [TASK-00111]
type: task
title: Keep browser keys and shared keys free
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: backlog
decisions: [ADR-00033]
depends_on: [TASK-00109]
related: [DOC-00003]
---

# Keep browser keys and shared keys free

Make the collision rules something the code enforces. Today `reserved.ts` lists 6 keys and the Settings row only shows a warning.

## Checklist

- [ ] The browser-owned list also covers `mod+l`, `mod+p`, `mod+d`, `mod+y`, `mod+r`, `mod+f`, `mod+[`, `mod+]` and `mod+digit`
- [ ] A test fails if a default shortcut uses `mod` other than `mod+k` or `mod+s`
- [ ] The Settings recorder refuses browser-owned keys and says why
- [ ] The Settings recorder refuses `.`, `,`, `;` and `?`, and `g` as a whole shortcut
- [ ] A test fails if two default shortcuts clash in a scope that can be active at once

## Notes
