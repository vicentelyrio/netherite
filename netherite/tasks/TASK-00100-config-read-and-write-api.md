---
id: TASK-00100
aliases: [TASK-00100]
type: task
title: Config read and write API
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: done
position: 48.25
decisions: [ADR-00030]
---

# Config read and write API

Endpoints the Settings page needs to read and change `.netherite/config.yml`, following [[ADR-00030]].

## Checklist

- [x] One function in `packages/core` edits the config, keeping comments, ordering and unknown keys, and only the changed lines differ
- [x] Only `states`, `freshness`, `inbox.rules` and `context` can be written; any other key is refused
- [x] A write is validated against the config schema before the disk is touched, and an invalid one changes nothing
- [x] A write based on an old hash is refused as a conflict
- [x] The read and write endpoints are defined in `packages/api` and served by `packages/server`
- [x] A saved change reaches the running server without a restart
- [x] Tests cover comments surviving, unknown keys surviving, refused keys, invalid values and conflicts
- [x] The configuration reference notes that the app can change these keys

## Notes

Awaiting review. `PATCH /api/config` takes `baseHash` and `set`; `GET /api/config` returns `hash` and `settings`, with every Inbox rule named.

- Editing a block list such as `states` drops comments inside that list. Every other edit leaves them alone.
- Duplicate state names are not refused yet: the config schema allows them, and [[TASK-00104]] needs that check.
- [[ADR-00030]] is still proposed.
