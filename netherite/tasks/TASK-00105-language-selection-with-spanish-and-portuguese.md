---
id: TASK-00105
aliases: [TASK-00105]
type: task
title: Language selection with Spanish and Portuguese
created: 2026-11-07T16:07:11Z
created_by: "@vicentelyrio"
project: PRJ-00008
state: doing
decisions: [ADR-00031]
depends_on: [TASK-00101]
---

# Language selection with Spanish and Portuguese

Add `es` and `pt-BR` and a language setting, following [[ADR-00031]].

## Checklist

- [x] All app messages are translated into `es` and `pt-BR`, and types confirm none are missing
- [x] A language setting on the General tab is saved per browser and applies without a reload
- [x] With no stored choice, the browser's language picks the closest match, otherwise English
- [x] Dates and numbers follow the chosen language
- [x] The `lang` attribute of the page follows the language
- [x] Bundle budget is updated on purpose
- [x] Tests cover choosing, remembering and the browser language fallback

## Notes

Awaiting review. Both translations were written by Claude and need a read by a native speaker.

- English left in `packages/ui` moved behind `UiLabelsProvider`, so badges, status pills, the Dismiss button, freshness and rail labels translate. Its defaults stay English.
- A scan of the main screens in Portuguese and Spanish also found and fixed hard-coded months, weekdays, link kinds, ADR statuses, relative dates and the "No area", "No project" and "Other" labels.
- Text from the server stays English by [[ADR-00031]], such as Inbox reasons like "Nothing links to it". Task state names are data from the config and are not translated.
- Scripts grew about 3.5% gzipped; the bundle budget was updated on purpose.
