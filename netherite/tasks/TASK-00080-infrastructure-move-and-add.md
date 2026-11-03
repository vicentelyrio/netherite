---
id: TASK-00080
aliases: [TASK-00080]
type: task
title: "Infrastructure: move and add"
created: 2026-11-02T20:29:59Z
created_by: "@vicentelyrio"
project: PRJ-00013
state: doing
depends_on: [TASK-00079]
---

# Infrastructure: move and add

- [x] Move `lib/api`, `app-context`, `queries`, `live`, `writes`, `notices`, `config` to `infrastructure/`
- [ ] i18n: message catalog and `t()`; move every user-facing string out of components
- [x] datetime: absolute, relative and range formatters with an injectable clock; replace ad-hoc date code
- [x] Settings and shortcuts context on top of `packages/ui` shortcuts

## i18n

Engine: typesafe-i18n (infrastructure/i18n, see its README). Base language is en/index.ts; types are generated with pnpm --filter @netherite/web i18n; I18nProvider wraps the app; the connection status is the first screen on it.

Left: move the user-facing strings of every feature and component into en/, one screen at a time, starting with the ones in features/knowledge and features/inbox. The generator needs its own TypeScript 5 (typescript5 devDependency and scripts/i18n.mjs) because TypeScript 7 has no JS compiler API.
