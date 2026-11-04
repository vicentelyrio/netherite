---
id: TASK-00098
aliases: [TASK-00098]
type: task
title: "`netherite new --template` and `netherite templates`"
created: 2026-11-04T20:20:05Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: backlog
decisions: [ADR-00029]
depends_on: [TASK-00097]
---

# `netherite new --template` and `netherite templates`

Use the templates from the CLI, and let a workspace override them ([[ADR-00029]]).

- [ ] `netherite new <type> <title> --template` starts from the template body; `--body` and `--body-file` still win
- [ ] `netherite templates` lists the types; `netherite templates <type>` prints that template
- [ ] A file in `netherite/templates/<type>.md` replaces the shipped one for this workspace
- [ ] Lint: a workspace template with an unknown frontmatter field gets a warning
- [ ] MCP `create` is unchanged ([[ADR-00012]]); the skills pass the template body themselves
- [ ] Tests: default, override, both body flags, unknown type, lint warning
