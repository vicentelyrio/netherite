---
id: ADR-00015
aliases: [ADR-00015]
type: adr
title: Defer the desktop app
status: accepted
date: 2026-10-31
deciders: ["@vicentelyrio"]
tags: [desktop, scope]
---

# Defer the desktop app

## Context

v1 shipped an Electron shell. In v2 the app is a local server plus the browser ([[ADR-00010]]), which covers the main uses: visualizing a repo while working in it, alongside an agent.

## Decision

- No desktop app in v2.0. `apps/desktop` is removed with the rest of v1 ([[ADR-00016]]).
- When a desktop app is wanted (workspace picker, dock icon, opening several repos), it will host the same server and SPA. Candidates: Tauri with the Node server as a sidecar, or Electron. The choice will be its own ADR.

## Consequences

- \+ Less to build and package for v2.0.
- − No standalone app for people who do not use a terminal.
