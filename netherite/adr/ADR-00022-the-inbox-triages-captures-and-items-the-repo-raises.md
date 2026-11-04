---
id: ADR-00022
aliases: [ADR-00022]
type: adr
title: The inbox triages captures and items the repo raises
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-02
deciders: ["@vicentelyrio"]
project: PRJ-00007
---

# The inbox triages captures and items the repo raises

## Context

[[DOC-00001]] describes an inbox file. The redesign turns it into a triage screen with three sources: captures typed into the app (appended to `inbox.md`), things the repo raises (stale docs, proposed ADRs waiting for a decision, orphans, overdue tasks), and things found in commits (a commit that "closes" a task that is still open, a new TODO comment, a tag that looks like an existing one).

## Decision

- **Captures** are lines in `inbox.md` at the workspace root, one per line, newest at the bottom. A capture turns into a task, doc, ADR, runbook or context item: the app writes the new file with a suggested project and tags, removes the line from `inbox.md`. The app never commits: the changed files wait in the working tree for the developer, or their agent, to commit. Archiving removes the line. Snoozing is app state (not a file change) until a chosen date.
- **Raised items** are computed, never stored: each has a stable key (rule, item, commit) so dismissing it survives a refresh. The rules are lint-like and listed in `docs/reference/lint.md` once built.
- Every action runs through the same operations as the CLI and MCP and only changes files, so accepting an ADR or marking a doc reviewed is one edit that the developer reviews and commits. Archiving and snoozing offer **undo** for a few seconds.
- Keyboard first: J/K move, E archives, H snoozes.

## Consequences

- \+ Capture is one line in a text file, usable from any editor.
- \+ Triage turns loose notes into typed, linked items with one file change each, and git stays read-only (ADR-00007).
- \- Nothing is committed for the developer, so a triaged item shows up as an uncommitted change until they commit it.
- \- Raised-item rules need tuning to avoid noise; each rule can be switched off in config.
- \- Reading commit messages for "closes" and TODO comments reads source files, which ADR-00007 allows because it stays read-only.
