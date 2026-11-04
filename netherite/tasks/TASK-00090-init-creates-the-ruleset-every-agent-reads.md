---
id: TASK-00090
aliases: [TASK-00090]
type: task
title: "`init` creates the ruleset every agent reads"
created: 2026-11-04T11:41:11Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: done
decisions: [ADR-00026]
---

# `init` creates the ruleset every agent reads

A standing instruction, as a context item, that tells agents to plan with Netherite and keep it up to date ([[ADR-00026]]).

- [x] Write the ruleset text, short enough to cost little on every run: plan first, track as you go, record lasting decisions as `proposed` ADRs, keep docs honest, ask when it is the person's call, never commit unless asked
- [x] `netherite init` creates it as a context item with `include_in_context: true`, high priority and every target, and runs `context sync` so `CLAUDE.md` and `AGENTS.md` have it
- [x] An existing workspace gets it with `netherite init` again, without touching what is there: a workspace that has one is left as it is, and nothing is printed
- [x] The MCP server's `instructions` point at the same ruleset
- [x] Tests: init creates and syncs it, init twice changes nothing, the MCP text mentions it
