---
id: TASK-00108
aliases: [TASK-00108]
type: task
title: Two-step shortcuts
created: 2026-11-10T11:01:25Z
created_by: "@vicentelyrio"
project: PRJ-00014
state: done
decisions: [ADR-00033]
depends_on: [TASK-00107]
related: [DOC-00003]
---

# Two-step shortcuts

Shortcuts are a single key combination today. Reaching pages with `g` then a letter needs a shortcut of two steps.

## Checklist

- [x] A shortcut can have two steps, and parsing, matching and formatting handle it
- [x] After the first step the dispatcher waits for a named time, then resets
- [x] A wrong second key cancels the sequence and does not fire that key's own action
- [x] The conflict check reports a clash when one shortcut's keys are the start of another's
- [x] The Settings recorder can record two steps
- [x] Editor-scope shortcuts cannot be two steps, since they are handed to CodeMirror as one key
- [x] Single-key overrides already saved in a browser keep working

## Notes
