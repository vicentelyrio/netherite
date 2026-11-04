---
id: ADR-00028
aliases: [ADR-00028]
type: adr
title: The documentation site is built from docs/ in the repository and published on GitHub Pages
created: 2026-11-04T20:10:01Z
created_by: "@vicentelyrio"
status: proposed
date: 2026-11-04
deciders: ["@vicentelyrio"]
project: PRJ-00008
---

# The documentation site is built from docs/ in the repository and published on GitHub Pages

## Context

The documentation is Markdown in `docs/` (getting started, concepts, reference for the CLI, config, lint, MCP and schemas) plus the README. It reads well on GitHub, but it has no search, no navigation, and no pages for installing, using agents, or migrating an existing repository.

## Decision

- **`docs/` stays the source of truth**, in the same repository as the code, so a change to a command and its page can go in one pull request and `lint` can keep checking them together.
- **A static site generator builds it** (the recommendation is Starlight or VitePress, chosen when the work starts, since both read plain Markdown) and a workflow publishes it to GitHub Pages on each push to `main`. No server, no account and no cost.
- **The README stays a short pitch and a quick start** and links to the site; it does not duplicate the pages.
- **Pages to add** before the first publish: Install (npx, global, dev dependency, Node 24), Agents (what `init` installs, how each skill triggers, MCP setup for Claude Code, Cursor and Codex, the ruleset), Templates (see the templates ADR) and Migrate an existing repository.
- **Command reference is generated from the CLI's own help** where it can be, so the page cannot disagree with `--help`.

## Consequences

- \+ Search and navigation without leaving the repository, and docs versioned with the code.
- \+ Free hosting with a stable URL that the README, the CLI and the npm page can link to.
- \- A docs build is one more thing in CI to keep green.
- \- Pages is public even for a private repository on some plans; the docs are meant to be public.
- \- A custom domain, if wanted later, is a separate small step.
