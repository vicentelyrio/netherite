export const runbook = `---
id: {{id}}
aliases: [{{id}}]
type: runbook
title: {{title}}
created: {{created}}
created_by: {{created_by}}
# covers: ["scripts/deploy.sh"]  # the files these steps run; it shows as stale when they change
# reviewed_at: 2026-01-15
# owner: "@handle"
# project: PRJ-00001
# explains: []
# status: active
# supersedes: []
# superseded_by: RUN-00002
# tags: []
---

# {{title}}

When to use this runbook, in one line.

## Before you start

What you need: access, tools, a clean state.

## Steps

1. The first step, as a command or an action.
2. The next one.

## Check it worked

How to tell the result is right.

## If it goes wrong

What to do, and who to ask.
`
