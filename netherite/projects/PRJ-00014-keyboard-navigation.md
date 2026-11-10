---
id: PRJ-00014
aliases: [PRJ-00014]
type: project
title: Keyboard navigation
created: 2026-11-10T11:00:25Z
created_by: "@vicentelyrio"
goals: [GOAL-00002]
status: active
decisions: [ADR-00033]
---

# Keyboard navigation

One keyboard model for the whole app: the same keys reach any page and move around any page, and each page adds its own keys on top. Default keys never collide with the browser.

## Scope

- One shortcut dispatcher with scopes for the app, the page and open overlays.
- Two-step shortcuts, used to reach every page (`g` then a letter), with a popup of the next keys.
- Moving between page sections, and between the sidebar and the page.
- Moving inside a section, and `Esc` climbing back out.
- Sections inside drawers and modals.
- Shared verbs and per-page keys.
- Collision rules, enforced by tests and by the Settings recorder.
- A cheat sheet on `?`, and a page in the documentation.

## Out of scope

- Shortcuts in the CLI or the documentation site.
- Changing the editor's Vim keys.
- Mouse behaviour and the order of the tab key, which stay as they are.

## Done when

Every page can be reached and every section visited without the mouse, using the same keys on every page, and no default shortcut is one the browser owns or overrides.
