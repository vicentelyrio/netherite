---
id: ADR-00001
aliases: [ADR-00001]
type: adr
title: Record decisions as Netherite ADRs in this repository
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [process, dogfooding]
---

# Record decisions as Netherite ADRs in this repository

## Context

v2 is a rewrite with many architectural choices. Netherite's own purpose is to keep decisions, docs and plans in the repo as typed Markdown. Building it is the first real test of the format.

## Decision

- Architecture decisions for Netherite are recorded as ADRs in `netherite/adr/`, using the format defined in [[ADR-00003]] and [[ADR-00004]].
- The product requirements live in [[DOC-00001]].
- The v2 plan (goals, projects, tasks) will also be written in this format, so this repository is the first workspace the app opens.
- While an ADR is `proposed` it is edited in place. All ADRs stay `proposed` until the author accepts them.
- Once an ADR is `accepted`, it is never edited to change its meaning. A new ADR supersedes it (`supersedes` / `superseded_by`).

## Consequences

- \+ The format is exercised from day one; gaps show up early.
- \+ Agents working on Netherite read its decisions through its own MCP server once it exists.
- − Until the linter exists, the files are validated by hand.
