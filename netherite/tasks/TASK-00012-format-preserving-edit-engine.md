---
id: TASK-00012
aliases: [TASK-00012]
type: task
title: Format-preserving edit engine
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00002
state: done
depends_on: [TASK-00008]
---

# Format-preserving edit engine

- [x] Frontmatter edits through the `yaml` Document API (set, unset, append to a list)
- [x] Body edits by splicing at mdast positions (toggle checklist item, replace or append a section)
- [x] Keep line endings, trailing newline and indentation
- [x] Golden-file tests for each edit

**Done when:** an edit to one field changes only that field's lines in every golden test.
