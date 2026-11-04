---
id: TASK-00092
aliases: [TASK-00092]
type: task
title: Skill `netherite-discover` proposes decisions nobody recorded
created: 2026-11-04T11:41:12Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: backlog
decisions: [ADR-00026]
depends_on: [TASK-00091]
---

# Skill `netherite-discover` proposes decisions nobody recorded

The optional second skill in [[ADR-00026]]: reconstruct ADRs from evidence. It runs only when the person says yes, after the migration.

- [ ] Ask first, and ask how far back to look and how many to propose
- [ ] Find evidence: commits and pull request text that explain a choice, dependency or tooling changes, large refactors, deleted or replaced modules
- [ ] Every ADR it makes is `proposed`, says it was reconstructed, links its evidence (commit hashes), and states its confidence
- [ ] It states only what the evidence says and never invents a rationale; where the reason is unknown it asks the person
- [ ] Track the work as tasks, like `netherite-migrate`
- [ ] Install it with the other skills
