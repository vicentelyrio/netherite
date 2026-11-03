// Runs the typesafe-i18n generator (types and helpers from `src/infrastructure/i18n/en`).
//
// The generator calls TypeScript's JS compiler API, which TypeScript 7 does not have, so
// `typescript` is pointed at the TypeScript 5 in `typescript5` for this one process. Nothing else
// uses that copy.
//
//   pnpm --filter @netherite/web i18n            generate once
//   pnpm --filter @netherite/web i18n --watch    regenerate on change
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('./i18n-loader.mjs', import.meta.url)

const watch = process.argv.includes('--watch')
process.argv = [process.argv[0], process.argv[1], ...(watch ? [] : ['--no-watch'])]
await import(
  pathToFileURL(
    new URL('../node_modules/typesafe-i18n/cli/typesafe-i18n.mjs', import.meta.url).pathname,
  ).href
)
