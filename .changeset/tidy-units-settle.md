---
'@vicentelyrio/netherite': patch
---

Reorganise the internals into small, single-purpose units. Commands, the API, the MCP server and the files Netherite writes behave as before.

- **Structure.** Every module now has its own folder with one entry point, large files are split by responsibility, and tests guard the layout.
- **Named values.** Item types, statuses and relations use shared enums instead of repeated strings, and `switch` statements are replaced by tables of strategies.
- **Settings.** Every default now lives in one catalog, with its type, limits, description and where it is set. Nothing new can be configured yet.
