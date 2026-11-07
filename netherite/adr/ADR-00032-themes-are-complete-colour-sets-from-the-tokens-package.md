---
id: ADR-00032
aliases: [ADR-00032]
type: adr
title: Themes are complete colour sets from the tokens package, chosen per browser
created: 2026-11-07T16:06:50Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-07
deciders: ["@vicentelyrio"]
project: PRJ-00008
---

# Themes are complete colour sets from the tokens package, chosen per browser

## Context

`packages/tokens` generates the Mantine theme and CSS variables ([[ADR-00011]]), and it holds one dark palette. `NetheriteProvider` forces the dark colour scheme and the editor theme declares itself dark. We want a small list of popular themes. Colour carries meaning here: type hue and status fill ([[ADR-00021]]), so a theme cannot be only a few accent colours.

## Decision

- A theme is a complete colour set with the same keys as the current palette, defined in `packages/tokens`. A missing colour is a type error.
- Each theme declares whether it is light or dark, and Mantine's colour scheme and the editor's theme follow that.
- The tokens package generates one block of CSS variables per theme, selected by a `data-theme` attribute on the root, so changing theme needs no re-render of the app and components keep using the same variables.
- The Settings page has a theme switcher listing every theme. A change applies at once, with no reload.
- The first list is Netherite (the default), Netherite Light, Dracula, Nord, Catppuccin Mocha, Tokyo Night, Gruvbox Dark and Solarized Light. Each borrowed palette has its licence checked and its source credited.
- Status and item type keep their meaning in every theme: each theme maps them to its own colours, and the existing contrast checks run against every theme.
- The choice is per browser, stored in `netherite.settings`. The favicon and logo keep the Netherite colours.

## Consequences

- \+ Adding a theme later is one data file, checked by types and contrast tests.
- \+ Components do not change, because they already use variables.
- \- Upstream palettes do not always meet our contrast rules, so some colours will be adjusted and the result will not match the original exactly.
- \- Any colour hard-coded outside the variables has to move, and every screen now needs checking in a light theme.
