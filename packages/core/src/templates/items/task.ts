export const task = `---
id: {{id}}
aliases: [{{id}}]
type: task
title: {{title}}
created: {{created}}
created_by: {{created_by}}
project: {{project}}
state: backlog
# assignees: ["@handle"]
# labels: [bug]
# depends_on: [TASK-00001]   # tasks that must be done first
# decisions: [ADR-00001]     # decisions this task follows
# related: [DOC-00001]       # anything else that helps
# due: 2026-12-31
# tags: []
---

# {{title}}

What needs doing and why, in one or two lines.

## Checklist

- [ ] First thing that must be true when this is done
- [ ] Second thing

## Notes

What was learned, what was tried, links.
`
