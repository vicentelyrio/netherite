---
id: TASK-00095
aliases: [TASK-00095]
type: task
title: "Docs: Install and Agents pages"
created: 2026-11-04T20:20:02Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: backlog
decisions: [ADR-00028]
---

# Docs: Install and Agents pages

The two pages the documentation is missing, from [[ADR-00028]]. Plain Markdown in `docs/`, linked from the README and from getting started.

- [ ] `docs/install.md`: `npx` versus global install versus dev dependency, the Node 24 requirement, upgrading, uninstalling, and what `init` adds to a repository
- [ ] `docs/agents.md`: what `init` installs, how each skill triggers and what it does, the ruleset once [[TASK-00090]] lands
- [ ] MCP setup snippets for Claude Code, Cursor, Codex and a generic stdio client, each tested against a real client or stated as untested
- [ ] A troubleshooting section: workspace not found, token rejected, port in use, skills out of date (`init --update`)
- [ ] Every command in the pages uses `@vicentelyrio/netherite` where `npx` is used, and a check script fails if a page prints a bare `npx netherite`
