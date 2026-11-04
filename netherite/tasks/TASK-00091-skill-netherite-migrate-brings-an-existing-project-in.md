---
id: TASK-00091
aliases: [TASK-00091]
type: task
title: Skill `netherite-migrate` brings an existing project in
created: 2026-11-04T11:41:11Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: backlog
decisions: [ADR-00026]
depends_on: [TASK-00088, TASK-00089]
---

# Skill `netherite-migrate` brings an existing project in

The skill that drives the migration in [[ADR-00026]]. It reads the repository, asks the person at every fork, and tracks its own work as a project with tasks.

- [ ] Survey phase, read-only: find docs and runbooks, decision records in other formats, convention files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`)
- [ ] Ask the person, each with a recommendation: copy or move the originals (copy), keep old ADR numbers (keep, renumber only on a clash), and the batch size (suggested from how many candidates the survey found)
- [ ] Make the plan with `netherite-plan`: one project, one task per batch, one checklist item per candidate with its source path
- [ ] Write each batch file, show it for review, run `netherite import` for what is accepted, and tick the items
- [ ] Guess `covers` from the paths a doc mentions, and add `explains` links, so freshness works at once
- [ ] Map old ADR statuses and `supersedes` links; convention files become context items within the token budget
- [ ] Finish with `lint`, a count of imported, skipped and needing review, and the offer to run `netherite-discover`
- [ ] Install it with the other skills, and update the skill list in the docs
