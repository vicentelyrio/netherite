---
id: ADR-00002
aliases: [ADR-00002]
type: adr
title: Use promises for async work
status: accepted
date: 2026-01-04
deciders: ["@ada", "@grace"]
supersedes: [ADR-00001]
created: 2026-01-04T09:00:00Z
created_by: "@grace"
---

# Use promises for async work

## Context

Callbacks from [[ADR-00001]] nest too deeply.

## Decision

Async work uses promises.
