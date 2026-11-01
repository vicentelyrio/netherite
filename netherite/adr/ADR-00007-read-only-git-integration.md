---
id: ADR-00007
aliases: [ADR-00007]
type: adr
title: Read-only git integration through the git CLI; Netherite never commits
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [git]
---

# Read-only git integration through the git CLI; Netherite never commits

## Context

Freshness, co-change, the decision log, stats, authorship and "uncommitted" markers all come from git. Committing is the user's workflow, done by them or their agent, not by Netherite.

## Decision

- `packages/git` spawns the system `git` binary with machine-readable output: `status --porcelain=v2`, `log --format=… --name-only`, `diff --numstat`, `rev-parse`, `config user.*`.
- Only read commands are allowed. The adapter exposes no API that stages, commits, checks out, resets or pushes.
- Results are cached per `HEAD` and invalidated when `HEAD` or the index changes.
- Without git (not a repo, or git missing) Netherite still works; git-derived features show "not available" instead of failing. Shallow clones show freshness as "unknown" past the history boundary.
- isomorphic-git and libgit2 bindings were rejected: the first is slow on long histories, the second adds native builds.

## Consequences

- \+ Fast, exact history queries, and no surprise commits.
- \+ Users keep full control of what lands in git.
- − Requires `git` on `PATH`. Windows path and quoting behaviour needs explicit tests.
