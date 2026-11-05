---
id: TASK-00006
aliases: [TASK-00006]
type: task
title: "`packages/schema`"
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00002
state: done
depends_on: [TASK-00003]
---

# `packages/schema`

- [x] Effect Schema definitions: common fields plus goal, project, task, adr, doc, context, runbook
- [x] ID format, prefixes and padding; branded `ItemId` per prefix and `Handle` types
- [x] Config schema (`.netherite/config.yml`), including task states and their categories
- [x] JSON Schema export for each type (`Schema.toJsonSchemaDocument`)
- [x] Unknown fields allowed and preserved (`onExcessProperty: "preserve"`)
- [x] Decode errors mapped to field-level messages (path, expected, received)

**Done when:** every fixture item validates, and each invalid fixture gives the expected field-level error.
