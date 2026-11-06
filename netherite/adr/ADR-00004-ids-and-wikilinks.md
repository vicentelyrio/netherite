---
id: ADR-00004
aliases: [ADR-00004]
type: adr
title: Stable typed IDs for machines, Obsidian wikilinks for people
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [ids, links, obsidian]
---

# Stable typed IDs for machines, Obsidian wikilinks for people

## Context

Agents and skills need short, stable, unambiguous handles. People want readable file names and Obsidian-style `[[links]]`, and the repo should open as an Obsidian vault.

## Decision

> ### IDs
>
> - Every item has `id: PREFIX-NNNNN` (5 digits, padding configurable): `GOAL-`, `PRJ-`, `TASK-`, `ADR-`, `DOC-`, `CTX-`, `RUN-`.
> - New IDs are allocated sequentially per prefix: highest existing number in the working tree + 1.
> - The ID is repeated in `aliases`, so Obsidian resolves `[[ADR-00007]]` natively.
> - File names are `<ID>-<slug>.md` (for example `ADR-00007-use-gnu-stow.md`). The slug is set at creation and does not follow later title changes; renaming is an explicit operation.
>
> ### Link resolution
>
> `[[target]]`, `[[target|label]]` and `[[target#heading]]` are supported. `target` resolves in this order: **id → alias → file name (without extension) → title**. A title matching more than one item is a lint warning; a link that resolves to nothing is a lint error.
>
> Agents and skills always write `[[ID]]`. People can write any form.
>
> ### Collisions across branches
>
> Two branches can each create `ADR-00008`. After merging:
>
> - `netherite lint` reports duplicate IDs (error).
> - `netherite renumber <path>` gives the newer item (by first commit) the next free ID and rewrites links that point to it in frontmatter and bodies.

## Consequences

- \+ Short, predictable handles for MCP tools and skills; readable names for people.
- \+ The repo works in Obsidian with no plugin.
- − Parallel branches collide occasionally and need a renumber. Accepted over random suffixes, which are hard to read and say aloud.
