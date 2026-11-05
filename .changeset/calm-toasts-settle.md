---
"@vicentelyrio/netherite": minor
---

Goal renaming, consistent empty states, and a quieter Inbox.

- **Goals.** Rename a goal from its page. A view filtered to one area shows `Goals / Area` as a breadcrumb in place of the "All areas" link.
- **Empty states.** Goals, Projects, Graph and a new one for Stats share one centered layout. Stats shows it when there are no goals, docs, runbooks or ADRs, and the Graph hides its time scrubber when there is nothing to draw.
- **Notices.** Success and info notices dismiss themselves after 5 seconds, or 10 with an action such as Undo, and hovering holds them. Errors, warnings and "restart needed" stay until dismissed. Notices no longer have a coloured border.
- **Inbox.** A doc or runbook that nothing links to is no longer raised under "Needs review". It is still raised when it goes stale, and `lint` and the Knowledge filter still list it as an orphan.
- **Copy.** Knowledge and the Decision log no longer name a `knowledge/` folder, and the ADR starter shows the real file name.
