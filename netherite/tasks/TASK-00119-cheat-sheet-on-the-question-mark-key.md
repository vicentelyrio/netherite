---
id: TASK-00119
aliases: [TASK-00119]
type: task
title: Cheat sheet on the question mark key
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: done
decisions: [ADR-00033]
depends_on: [TASK-00116]
related: [DOC-00003]
---

# Cheat sheet on the question mark key

`?` shows every key that works right now, so the keys can be discovered from any page.

## Checklist

- [x] `?` opens the sheet on every page, and not while typing
- [x] It is built from the registry, with no separate list to maintain
- [x] The current page's keys come first, then moving around, then reaching a page
- [x] It shows rebound keys and leaves out cleared ones
- [x] An e2e test opens it on two pages and sees different page keys

## Notes
