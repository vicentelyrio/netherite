---
id: TASK-00008
aliases: [TASK-00008]
type: task
title: Parser and shared remark plugins
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00002
state: done
depends_on: [TASK-00006]
---

# Parser and shared remark plugins

- [x] Frontmatter plus mdast, keeping source positions
- [x] Wikilink plugin: `[[t]]`, `[[t|label]]`, `[[t#heading]]`; ignores code spans and code blocks
- [x] Extracts the checklist (with positions), headings and plain text
- [x] Publish the plugins so the app reuses them ([[TASK-00034]])
