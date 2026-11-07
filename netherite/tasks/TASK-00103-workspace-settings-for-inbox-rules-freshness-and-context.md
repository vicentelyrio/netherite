---
id: TASK-00103
aliases: [TASK-00103]
type: task
title: Workspace settings for inbox rules, freshness and context
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: backlog
decisions: [ADR-00030]
depends_on: [TASK-00100, TASK-00101]
---

# Workspace settings for inbox rules, freshness and context

A Workspace tab for the simple shared settings, saved to `config.yml` through the config API.

## Checklist

- [ ] Each Inbox rule can be turned on and off
- [ ] Freshness `drifting` and `stale` can be changed, with their limits enforced
- [ ] Context budget and targets can be changed
- [ ] The tab says these are shared through git and show up as uncommitted changes
- [ ] An invalid `config.yml` shows the problem and does not offer to overwrite it
- [ ] A conflict with an edit made elsewhere is shown, and the newer values can be loaded
- [ ] End-to-end test: a change on the page appears in the file diff with its comments intact

## Notes
