---
id: TASK-00089
aliases: [TASK-00089]
type: task
title: "`netherite import` applies an accepted batch of items"
created: 2026-11-04T11:41:10Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: backlog
decisions: [ADR-00026]
depends_on: [TASK-00088]
---

# `netherite import` applies an accepted batch of items

The deterministic half of the migration in [[ADR-00026]]: the agent classifies, this command writes. It takes a batch file (a list of candidates with source, type, title, optional id, and whether to copy or move) and creates the items through the normal validated operations.

- [ ] Define the batch file: one entry per candidate with `source`, `type`, `title`, optional `id`, optional `fields`, and `mode: copy | move`
- [ ] Create each item with `source` and `imported_at`; keep the body of the original and add frontmatter
- [ ] Idempotent: an entry whose `source` is already imported is skipped, or updated with `--update`
- [ ] An explicit `id` that is taken is reported and left to the person, not renumbered silently
- [ ] `mode: move` leaves a one-line stub where the original was only when asked for
- [ ] `--dry-run` prints what would be created, and `--json` reports created, skipped and failed per entry
- [ ] Never commits ([[ADR-00022]]); a failed entry does not stop the rest, and is listed at the end
- [ ] Tests: copy, move, idempotent re-run, id clash, bad type, dry run
