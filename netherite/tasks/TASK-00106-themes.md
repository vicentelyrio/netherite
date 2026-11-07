---
id: TASK-00106
aliases: [TASK-00106]
type: task
title: Themes
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: backlog
decisions: [ADR-00032]
depends_on: [TASK-00101]
---

# Themes

Add the theme system and first list of themes, following [[ADR-00032]]: Netherite, Netherite Light, Dracula, Nord, Catppuccin Mocha, Tokyo Night, Gruvbox Dark and Solarized Light.

## Checklist

- [ ] Each theme is a complete colour set in `packages/tokens`, and a missing colour is a type error
- [ ] Each borrowed palette has its licence checked and its source credited
- [ ] A theme picker on the General tab is saved per browser and applies without a reload or a flash on load
- [ ] Mantine's colour scheme and the editor theme follow the theme's light or dark type
- [ ] No colours are hard-coded outside the variables, including the graph and syntax colours
- [ ] Contrast checks run against every theme and pass
- [ ] Status and item type stay distinguishable in every theme
- [ ] Every main screen is checked in one light and one dark theme

## Notes
