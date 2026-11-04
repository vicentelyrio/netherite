---
id: TASK-00097
aliases: [TASK-00097]
type: task
title: Starter template for each item type
created: 2026-11-04T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: doing
decisions: [ADR-00029]
---

# Starter template for each item type

The template files from [[ADR-00029]]: goal, project, task, ADR, doc, context and runbook.

- [x] One template per type in `packages/core/src/templates.ts` (plain strings, like the skills, so they bundle without a file copy), with every optional frontmatter field present and commented, and the body sections the app and lint understand
- [x] Placeholders are marked in one way (`{{title}}`, `{{date}}`) and filled by a single function
- [x] Tests: each template, once filled, parses against the schema and passes lint with no problems
- [ ] The templates are in the published package: they are exported from core but only reach the bundle once the CLI uses them ([[TASK-00098]])
