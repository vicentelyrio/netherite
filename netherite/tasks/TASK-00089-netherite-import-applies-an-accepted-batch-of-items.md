---
id: TASK-00089
aliases: [TASK-00089]
type: task
title: "`netherite import` applies an accepted batch of items"
created: 2026-11-04T11:41:10Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: done
decisions: [ADR-00026]
depends_on: [TASK-00088]
---

# `netherite import` applies an accepted batch of items

The deterministic half of the migration in [[ADR-00026]]: the agent classifies, this command writes. It takes a batch file (a list of candidates with source, type, title, optional id, and whether to copy or move) and creates the items through the normal validated operations.

- [x] Define the batch file: one entry per candidate with `source`, `type`, `title`, optional `id`, optional `fields`, and `mode: copy | move`
- [x] Create each item with `source` and `imported_at`; keep the body of the original and add frontmatter
- [x] Idempotent: an entry whose `source` is already imported is skipped, or updated with `--update`
- [x] An explicit `id` that is taken is reported and left to the person, not renumbered silently
- [x] `mode: move` leaves a one-line stub where the original was only when asked for
- [x] `--dry-run` prints what would be created, and `--json` reports created, skipped and failed per entry (a dry run checks the entries and IDs, not each field against the schema)
- [x] Never commits ([[ADR-00022]]); a failed entry does not stop the rest, and is listed at the end
- [x] Tests: copy, move, idempotent re-run, id clash, bad type, dry run
