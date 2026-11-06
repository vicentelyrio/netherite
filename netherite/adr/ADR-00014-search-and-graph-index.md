---
id: ADR-00014
aliases: [ADR-00014]
type: adr
title: In-memory index for search and graph
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [index, search, graph]
---

# In-memory index for search and graph

## Context

A workspace holds hundreds to a few thousand Markdown files. Search, backlinks, the graph, the Inbox and lint all need the same parsed view.

## Decision

> - On start, `core` parses every file under the content root into an **item index** (frontmatter, headings, links, checklist, plain text) plus a **graphology** graph of typed edges and references.
> - File watcher events update the affected items and edges incrementally.
> - **Full-text search** uses MiniSearch over id, title, aliases, path and body, with prefix and fuzzy matching and boosts for id and title.
> - No database or on-disk cache in v2. If start-up exceeds the target (2 s for 5,000 files), add a cache in `.netherite/local/` keyed by file hash.
> - The graph layout runs in the browser ([[ADR-00011]]). Node positions are not persisted in v2.

## Consequences

- \+ Simple, fast, and nothing to migrate or corrupt.
- \+ The same index serves the app, MCP and the CLI.
- − Memory grows with workspace size; fine at the target scale.
