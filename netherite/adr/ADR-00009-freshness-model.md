---
id: ADR-00009
aliases: [ADR-00009]
type: adr
title: Freshness from covered paths and commits since review
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [freshness, git, knowledge]
---

# Freshness from covered paths and commits since review

## Context

The main way knowledge fails is silently going out of date. The design shows fresh, drifting and stale states, a "Mark reviewed" action and co-changed files.

## Decision

> - Docs, runbooks and context may declare `covers:`, a list of path globs relative to the repo root.
> - **Baseline** is `reviewed_at` if set, otherwise the date of the last commit that touched the item's own file.
> - **Count** is the number of commits after the baseline that touched any covered path (uncommitted changes to covered paths count as one more).
> - **States** (thresholds in config): `fresh` = 0, `drifting` = 1–9, `stale` ≥ 10. `not tracked` when there is no `covers:`, or for superseded and deprecated ADRs.
> - **Mark reviewed** sets `reviewed_at` to today through a core operation. It is a file edit like any other; no commit.
> - **Co-changed files:** for each item, the files most often changed in the same commits as the item's file. Shown as a hint, and offered as suggestions for `covers:`.
> - Stale and drifting items appear in the Inbox and in `netherite lint` (warning, configurable to error in CI).

## Consequences

- \+ Stale docs surface without anyone having to look.
- \+ Fully derived from git and frontmatter; nothing extra to maintain.
- − Commit count is a proxy; a large refactor in one commit counts once. Accepted for v2.
