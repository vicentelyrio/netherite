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
