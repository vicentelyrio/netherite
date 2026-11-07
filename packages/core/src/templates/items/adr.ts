export const adr = `---
id: {{id}}
aliases: [{{id}}]
type: adr
title: {{title}}
created: {{created}}
created_by: {{created_by}}
status: proposed
date: {{date}}
deciders: [{{created_by}}]
# project: PRJ-00001
# supersedes: [ADR-00001]    # decisions this one replaces
# superseded_by: ADR-00002   # set when a later decision replaces this one
# tags: []
---

# {{title}}

## Context

The forces at play: what is the situation, what is being asked, what limits the choice.

## Decision

> What was chosen, in the active voice: "We use X for Y."
>
> - A bullet for each part of the decision.

## Consequences

- \\+ What gets easier or better.
- \\- What gets harder, and what is given up.
`
