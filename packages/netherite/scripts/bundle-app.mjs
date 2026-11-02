// Copies the built app (apps/web/dist) next to the program, where `netherite serve` looks for it.
import { copyFileSync, cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const from = join(here, '../../../apps/web/dist')
const to = join(here, '../dist/app')

if (!existsSync(join(from, 'index.html'))) {
  console.error('The app is not built: run `pnpm --filter @netherite/web build` first.')
  process.exit(1)
}
rmSync(to, { recursive: true, force: true })
cpSync(from, to, { recursive: true })
console.log(`Bundled the app into ${to}`)

// The package page on npm shows the README, where the repository's relative links would not work.
const base = 'https://github.com/vicentelyrio/netherite/blob/main/'
const readme = readFileSync(join(here, '../../../README.md'), 'utf8').replace(
  /\]\((docs\/[^)]+)\)/g,
  (_, path) => `](${base}${path})`,
)
writeFileSync(join(here, '../README.md'), readme)
console.log('Wrote the package README')

copyFileSync(join(here, '../../../LICENSE'), join(here, '../LICENSE'))
console.log('Copied the LICENSE')
