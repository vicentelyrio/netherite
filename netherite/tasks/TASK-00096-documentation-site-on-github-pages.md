---
id: TASK-00096
aliases: [TASK-00096]
type: task
title: Documentation site on GitHub Pages
created: 2026-11-04T20:20:03Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: backlog
decisions: [ADR-00028]
depends_on: [TASK-00095]
---

# Documentation site on GitHub Pages

Build `docs/` into a site and publish it, as decided in [[ADR-00028]].

- [ ] Pick the generator (Starlight or VitePress) with a short note on why, and set it up in `docs/` or a `site/` folder without touching the published package
- [ ] Sidebar: Getting started, Install, Concepts, Agents, Templates, Migrate, Reference (CLI, config, lint, MCP, schemas), Obsidian
- [ ] Generate the CLI reference from `netherite --help` (extend `scripts/gen-reference.mjs`) and fail CI when the committed page is out of date
- [ ] Workflow `docs.yml`: build on pull requests, deploy to GitHub Pages on push to `main`
- [ ] Search works offline in the built site; links to `docs/` Markdown from the README point at the site
- [ ] Add the site URL to the README, to `package.json` `homepage` and to the CLI's `--help` footer
