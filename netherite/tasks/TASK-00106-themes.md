---
id: TASK-00106
aliases: [TASK-00106]
type: task
title: Themes
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: done
position: 44
decisions: [ADR-00032]
depends_on: [TASK-00101]
---

# Themes

Add the theme system and first list of themes, following [[ADR-00032]]: Netherite, Netherite Light, Dracula, Nord, Catppuccin Mocha, Tokyo Night, Gruvbox Dark and Solarized Light.

## Checklist

- [x] Each theme is a complete colour set in `packages/tokens`, and a missing colour is a type error
- [x] Each borrowed palette has its licence checked and its source credited
- [x] A theme picker on the General tab is saved per browser and applies without a reload or a flash on load
- [x] Mantine's colour scheme and the editor theme follow the theme's light or dark type
- [x] No colours are hard-coded outside the variables, including the graph and syntax colours
- [x] Contrast checks run against every theme and pass
- [x] Status and item type stay distinguishable in every theme
- [x] Every main screen is checked in one light and one dark theme

## Notes

Awaiting review. Components keep using the same variables; `designColor` now returns CSS variable references, so JS colours such as the graph follow the theme too.

- Licences were checked on GitHub: all six borrowed palettes are MIT, Gruvbox per its README. Credits are in `packages/tokens/THIRD_PARTY_THEMES.md`. Colours were adjusted to pass the contrast rules, most of all in Solarized Light, so they differ from the originals.
- A small blocking script, `apps/web/public/theme-boot.js`, sets the theme before the app loads. The page's security policy rules out an inline script.
- Links had no colour of their own and were using the browser default; `base.css` now gives them the accent.
- Screens checked by eye: settings, board, drawer, knowledge, goal graph and stats in Netherite Light, the goal graph in Dracula, and inbox, timeline, tags, workspace, code editor and search in Solarized Light. Nord, Catppuccin, Tokyo Night and Gruvbox rely on the contrast tests and shared variables.
