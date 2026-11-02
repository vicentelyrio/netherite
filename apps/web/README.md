# @netherite/web

The Netherite app. Layers in `src/` (ADR-00024), each importing only from the ones above it in this list:

| Folder | Holds |
|---|---|
| `infrastructure/` | API client, queries, live updates, notices, config and settings contexts, i18n, datetime |
| `components/` | small presentational pieces around `@netherite/ui` |
| `templates/` | page shells on the column grid, slots only |
| `features/` | a component that does a job for one entity, with its data |
| `pages/` | a route: places features into a template; no styling, no fetching |

Rules, enforced by Biome (`noRestrictedImports`): a layer never imports upward; cross-folder imports use the `@/` alias (`@/components/ProgressBar`), not `../../`; only `@netherite/ui` imports Mantine. Tests sit next to the code. A new thing goes in the lowest layer that can hold it.

`lib/`, `editor/`, `graph/`, `shell.tsx` and `search.tsx` are the old layout; they move into the layers under TASK-00080 to TASK-00084.
