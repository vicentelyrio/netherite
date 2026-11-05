// Checks the browser build against `bundle-budget.json` (TASK-00005): the app may use `Schema`
// and the HTTP client from `effect`, so no module of `effect` may appear that the record does not
// already have, and neither `effect` nor the scripts as a whole may grow past a small margin.
//
//   node scripts/check-bundle.mjs            check the build in dist/
//   node scripts/check-bundle.mjs --update   write what the build uses now as the new record
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compare, effectModulesOf, gzipBytesOf, snapshot } from './bundle.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const recordPath = join(root, 'bundle-budget.json')

if (!existsSync(join(root, '.bundle-report.json'))) {
  console.error('No build report. Run `pnpm --filter @netherite/web build` first.')
  process.exit(2)
}
const report = JSON.parse(readFileSync(join(root, '.bundle-report.json'), 'utf8'))
const current = snapshot(effectModulesOf(report), gzipBytesOf(dist))

if (process.argv.includes('--update')) {
  writeFileSync(recordPath, `${JSON.stringify(current, null, 2)}\n`)
  console.log(
    `Recorded ${current.effect.modules.length} effect modules, ${current.effect.bytes} bytes, ${current.gzipBytes} bytes gzipped.`,
  )
  process.exit(0)
}

const record = JSON.parse(readFileSync(recordPath, 'utf8'))
const problems = compare(current, record)
if (problems.length > 0) {
  console.error(problems.join('\n\n'))
  console.error(
    '\nIf this is meant, run `pnpm --filter @netherite/web bundle:update` and commit bundle-budget.json.',
  )
  process.exit(1)
}
console.log(
  `Bundle ok: ${current.effect.modules.length} effect modules (${current.effect.bytes} bytes), ${current.gzipBytes} bytes gzipped.`,
)
