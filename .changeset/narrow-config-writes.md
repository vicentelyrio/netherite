---
'@vicentelyrio/netherite': minor
---

The server can read and change the workspace config.

- **Reading and writing.** `GET` and `PATCH /api/config` read and change `states`, `freshness`, `context` and `inbox.rules`. Other keys are refused.
- **Your file stays yours.** Only the lines for changed values differ. Comments and unknown keys are kept, and an edit based on an out-of-date file is refused.
