---
id: TASK-00097
aliases: [TASK-00097]
type: task
title: Starter template for each item type
created: 2026-11-04T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: backlog
decisions: [ADR-00029]
---

# Starter template for each item type

The template files from [[ADR-00029]]: goal, project, task, ADR, doc, context and runbook.

- [ ] One Markdown file per type in `packages/schema/templates/` (or the package that owns the item shapes), with every optional frontmatter field present and commented, and the body sections the app and lint understand
- [ ] Placeholders are marked in one way (`{{title}}`, `{{date}}`) and filled by a single function
- [ ] Tests: each template, once filled, parses against the schema and passes lint with no problems
- [ ] The files are included in the published package
