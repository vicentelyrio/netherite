---
id: ADR-00008
aliases: [ADR-00008]
type: adr
title: Edits change only the targeted lines and never reformat a file
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [editing, files]
---

# Edits change only the targeted lines and never reformat a file

## Context

People (in the app, in their editor, in Obsidian) and agents (over MCP) edit the same files, often at the same time. Re-serializing a whole file would rewrite YAML style, drop comments, reorder keys and produce noisy diffs.

## Decision

> - **Frontmatter** is edited with the `yaml` package's Document API, which keeps comments, key order, quoting and flow style. New keys are appended in schema order.
> - **Body** edits (toggling a checklist item, appending a section) are made by splicing the original string at positions taken from the mdast, never by stringifying the whole tree.
> - Line endings, trailing newline and indentation style of each file are detected and kept.
> - **Optimistic concurrency:** every operation carries the content hash it was based on. If the file changed on disk since then, the write fails with a tagged `ConflictError` (HTTP 409, an MCP error result) and the caller reloads. The app editor shows this as "changed on disk".
> - Writes are atomic through the `FileSystem` service: write a temp file in the same directory, then rename.
> - Golden-file tests cover each operation: input file + operation → exact expected output.

## Consequences

- \+ Diffs show only the intended change, so reviews stay readable.
- \+ Safe to edit from the app while an agent or Obsidian has the file open.
- − More implementation work than parse-and-serialize, concentrated in `core`.
