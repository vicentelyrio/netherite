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
- When a desktop app is wanted (workspace picker, dock icon, opening several repos), it will host the same server and SPA. The shell will be **Tauri**, not Electron: Electron installs are large and use a lot of memory, and the author has had good results with Tauri.
- The Effect server ([[ADR-00010]]) runs as a **sidecar**: the CLI compiled to a single executable (Node single-executable application or `bun build --compile`, chosen then by measuring size and compatibility with `@parcel/watcher`). Tauri starts it on a free loopback port, passes the per-session token, and the webview loads the same SPA.
- Rust code in the shell stays minimal (window, workspace picker, sidecar lifecycle). Logic stays in TypeScript so the app, CLI and MCP keep one implementation.
- Known work: test CodeMirror and the graph on the three system webviews (WKWebView, WebView2, WebKitGTK), and code-sign and notarise the sidecar.

## Consequences

- \+ Less to build and package for v2.0.
- − No standalone app for people who do not use a terminal.
- − The Tauri path still ships a Node runtime inside the sidecar, so the install is smaller than Electron but not tiny.
