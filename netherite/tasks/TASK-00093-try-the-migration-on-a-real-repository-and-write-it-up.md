---
id: TASK-00093
aliases: [TASK-00093]
type: task
title: Try the migration on a real repository and write it up
created: 2026-11-04T11:41:12Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: backlog
decisions: [ADR-00026]
depends_on: [TASK-00089, TASK-00090, TASK-00091]
---

# Try the migration on a real repository and write it up

Run the whole flow once, so the skills and the command are shaped by use and not only by tests ([[ADR-00026]]).

- [ ] An end-to-end test on a fixture repository with a README, a `docs/` folder, MADR-style ADRs and a `CLAUDE.md`
- [ ] Run `netherite-migrate` on a real repository of yours and note what the survey missed or got wrong
- [ ] Write a doc, "Migrate an existing repository", with the flow, the questions the skill asks and what to review
- [ ] Adjust the skills from what the real run showed
