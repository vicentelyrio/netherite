---
id: TASK-00103
aliases: [TASK-00103]
type: task
title: Workspace settings for inbox rules, freshness and context
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: done
position: 47
decisions: [ADR-00030]
depends_on: [TASK-00100, TASK-00101]
---

# Workspace settings for inbox rules, freshness and context

A Workspace tab for the simple shared settings, saved to `config.yml` through the config API.

## Checklist

- [x] Each Inbox rule can be turned on and off
- [x] Freshness `drifting` and `stale` can be changed, with their limits enforced
- [x] Context budget and targets can be changed
- [x] The tab says these are shared through git and show up as uncommitted changes
- [x] An invalid `config.yml` shows the problem and does not offer to overwrite it
- [x] A conflict with an edit made elsewhere is shown, and the newer values can be loaded
- [x] End-to-end test: a change on the page appears in the file diff with its comments intact

## Notes

Awaiting review. Writes run one at a time and read the latest hash when they start, so quick toggles do not conflict with each other. Number fields save on blur or Enter.

- Drifting cannot pass Stale in the form, which the config schema does not enforce. Raising both means raising Stale first.
- The watcher now reports a broken config being fixed even when the values come back the same, or the page would stay on its error.
- Changing context targets edits the config only. It does not sync the files by itself.
