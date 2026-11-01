---
id: ADR-00002
aliases: [ADR-00002]
type: adr
title: A workspace is one git repository
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [workspace, layout]
---

# A workspace is one git repository

## Context

v1 read files from a fixed personal folder (`~/Documents/@netherite`). v2 is about keeping knowledge next to the code it describes, so agents and reviewers see it in the same place and it branches and diffs with the code.

## Decision

- A **workspace** is a single git repository. Goals act as milestones for that repo; projects and tasks hang under them; knowledge sits alongside.
- Configuration lives in `.netherite/config.yml` at the repo root. Its presence marks a workspace. Netherite finds it by walking up from the current directory.
- All items live under one content root, `netherite/` by default (configurable), grouped by type:

```
.netherite/
  config.yml        # committed
  local/            # gitignored: per-user state (inbox "last seen", activity log)
netherite/
  goals/  projects/  tasks/
  adr/  docs/  context/  runbooks/
  assets/           # images and files referenced by items
```

- **Relationships live in frontmatter, not folders.** A task points at its project with `project: PRJ-00003`. Moving a task to another project edits one field and never moves a file.
- Folders are a convention. The indexer accepts a known type anywhere under the root, and lint warns when a file is outside its type folder.
- `config.yml` holds: content root, task states and their categories (todo / active / blocked / done), freshness thresholds, AI-context budget and targets, and ID padding.

## Consequences

- \+ Everything is plain files in the repo; nothing to host or sync.
- \+ Flat type folders are easy for agents to address and stable under re-parenting.
- − Work spanning several repos needs one workspace per repo; cross-repo views are out of scope for v2.
- − Personal per-user state must stay in the gitignored `.netherite/local/`.
