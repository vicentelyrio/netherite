---
'@vicentelyrio/netherite': minor
---

Link docs and runbooks, and choose what they cover, from the app.

- **Orphans.** A doc or runbook that sets `explains`, `project` or `covers` is no longer an orphan, in the app or in `netherite lint`. ADRs and context items keep the old rule: something must link to them.
- **Links.** The side panel of a doc or runbook has "Link to…", which writes `explains`, and each of those links can be removed from the same place.
- **Covers.** The side panel of a doc, runbook or context item lists its `covers` paths and lets you add or remove them.
- **Runbooks.** A new runbook starts from its template, including a workspace's own, with the first line selected. Docs still start blank.
- **API.** `POST /items` accepts `template: true` to start the body from the type's template.
