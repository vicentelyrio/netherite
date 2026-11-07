---
id: ADR-00030
aliases: [ADR-00030]
type: adr
title: The app edits the workspace config through a narrow, comment-preserving API
created: 2026-11-07T16:06:50Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-07
deciders: ["@vicentelyrio"]
project: PRJ-00008
---

# The app edits the workspace config through a narrow, comment-preserving API

## Context

`.netherite/config.yml` holds settings shared through git ([[ADR-00002]]), and today only a text editor can change it. People want to change several of them on the Settings page. The file is hand-edited and commented, `netherite init` writes its defaults as comments, unknown keys must survive, and some keys are dangerous to change from a form: moving `content` needs a restart and relocates every item.

## Decision

> We add a read and a write endpoint to the HTTP API ([[ADR-00019]]), backed by one function in `packages/core`.
>
> - Writes edit the parsed YAML document, so comments, ordering and unknown keys survive, and only changed lines differ.
> - Only an allowlist can be written: `states`, `freshness`, `inbox.rules` and `context`. `version`, `content` and `id_padding` are refused.
> - A write is validated against the config schema before it reaches the disk, and carries the hash it was based on, so an edit made elsewhere is a conflict and not an overwrite.
> - The app never commits. A change is an uncommitted edit to `config.yml`, like any other edit it makes.
> - The running server picks the change up through the watcher it already has ([[ADR-00010]]).

## Consequences

- \+ Shared settings can be changed from the app, and the change is reviewable in git like any other.
- \+ Hand-written comments and keys Netherite does not know about are safe.
- \- A local server can now write its own configuration, which raises the cost of a bug in validation.
- \- Keys outside the allowlist still need a text editor, so the page shows only part of the file.
