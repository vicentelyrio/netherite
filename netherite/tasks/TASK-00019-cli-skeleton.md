---
id: TASK-00019
aliases: [TASK-00019]
type: task
title: CLI skeleton
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: done
depends_on: [TASK-00013]
---

# CLI skeleton

- [x] `netherite` binary built with `effect/cli`, with commands `init`, `new <type>`, `lint`, `renumber`
- [x] `init` creates the config, folders and `.gitignore` entry for `.netherite/local/`
- [x] `lint` output: human-readable and `--json`; exit codes for CI
- [x] `lint --fix` applies the fixable rules through core operations (never commits); `--fix --dry-run` prints the diff
