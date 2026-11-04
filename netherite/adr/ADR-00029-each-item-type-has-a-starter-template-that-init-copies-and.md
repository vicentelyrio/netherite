---
id: ADR-00029
aliases: [ADR-00029]
type: adr
title: Each item type has a starter template that init copies and new can print
created: 2026-11-04T20:10:01Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-04
deciders: ["@vicentelyrio"]
project: PRJ-00008
---

# Each item type has a starter template that init copies and new can print

## Context

People creating a doc, runbook, ADR or task by hand have to know which frontmatter fields exist and which sections the app expects (for example the ADR sections read by the decision view). `netherite new` only writes a title and an optional `--body`, so every item starts nearly empty and every agent invents its own layout.

## Decision

- **One template per type** (goal, project, task, ADR, doc, context, runbook): real frontmatter with every optional field present and commented, and the body sections the app and lint understand.
- **Templates ship in the package** and are shown in the documentation site as copyable examples, generated from the same files so the page cannot drift.
- **`netherite new <type> <title> --template`** uses the template body, and `netherite templates` lists them and prints one. A workspace can override a template by placing a file in `netherite/templates/`; the workspace copy wins.
- **Templates are validated by the tests**: each one must parse against the schema and pass lint once its placeholders are filled.
- **Skills use the templates** (`netherite-adr`, `netherite-plan`, `netherite-migrate`), so agents and people write the same shape.

## Consequences

- \+ Consistent items, and a faster start for people who do not know the schema.
- \+ Agents stop inventing sections; reviewing an ADR or runbook looks the same everywhere.
- \- Templates are one more surface to keep in step with the schema; the tests are what keep them honest.
- \- A workspace override can go stale when the schema changes, so lint should warn when an override uses an unknown field.
