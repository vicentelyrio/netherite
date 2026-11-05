---
id: TASK-00099
aliases: [TASK-00099]
type: task
title: Templates in the docs and in the skills
created: 2026-11-04T20:20:06Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: done
decisions: [ADR-00029]
depends_on: [TASK-00097, TASK-00098]
---

# Templates in the docs and in the skills

Make the templates the one shape people and agents write ([[ADR-00029]]).

- [x] `docs/templates.md`: each template shown as a copyable block, generated from the shipped files
- [x] `netherite-adr`, `netherite-plan`, `netherite-context` and the migration skills ([[TASK-00091]]) tell the agent to start from the template
- [x] `init --update` refreshes the skills; check it leaves workspace templates alone
- [x] Getting started links to the templates page
