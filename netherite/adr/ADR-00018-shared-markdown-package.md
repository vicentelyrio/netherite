---
id: ADR-00018
aliases: [ADR-00018]
type: adr
title: A shared markdown package for parsing and remark plugins
status: proposed
date: 2026-11-01
deciders: ["@vicentelyrio"]
tags: [markdown, packages, parsing]
---

# A shared markdown package for parsing and remark plugins

## Context

[[ADR-00011]] says the app renders Markdown with the same remark plugins that `core` uses to parse files, and [[ADR-00006]] says `core` runs in Node only. Both need the wikilink plugin and the extraction of headings, checklists and links, so that code cannot live in `core`. [[ADR-00006]] lists no package for it.

## Decision

Add `packages/markdown` (`@netherite/markdown`).

- It holds the unified processor (remark-parse, remark-frontmatter, remark-gfm), the wikilink plugin ([[ADR-00004]]), and `parseMarkdown`, which returns the frontmatter with offsets and errors, the mdast tree, and headings (with section ranges), links, checklist items (with the offset to toggle) and plain text, all with absolute source positions.
- It is pure and browser-safe: no Node imports, no `@netherite/*` dependencies. `core` and `apps/web` may depend on it. Nothing else needs to.
- It reads and parses; it never writes. Edits stay in `core` ([[ADR-00008]]), which uses the positions this package returns.

## Consequences

- \+ One parser for the server, the CLI, MCP and the app, so a link or checklist means the same thing everywhere.
- \+ Positions needed for format-preserving edits come from the same pass that reads the file.
- − One more package, and `core` and `web` gain a dependency, which the import-boundary lint rule now allows.
