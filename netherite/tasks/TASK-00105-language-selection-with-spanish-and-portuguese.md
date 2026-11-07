---
id: TASK-00105
aliases: [TASK-00105]
type: task
title: Language selection with Spanish and Portuguese
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: backlog
decisions: [ADR-00031]
depends_on: [TASK-00101]
---

# Language selection with Spanish and Portuguese

Add `es` and `pt-BR` and a language setting, following [[ADR-00031]].

## Checklist

- [ ] All app messages are translated into `es` and `pt-BR`, and types confirm none are missing
- [ ] A language setting on the General tab is saved per browser and applies without a reload
- [ ] With no stored choice, the browser's language picks the closest match, otherwise English
- [ ] Dates and numbers follow the chosen language
- [ ] The `lang` attribute of the page follows the language
- [ ] Bundle budget is updated on purpose
- [ ] Tests cover choosing, remembering and the browser language fallback

## Notes
