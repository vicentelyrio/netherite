// Fails when a page prints `npx netherite`, which would run someone else's package: the published
// name is `@vicentelyrio/netherite` (ADR-00027). `npx @vicentelyrio/netherite` and a bare
// `netherite` (after an install) are fine.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const bare = /npx\s+(?:--yes\s+|-y\s+)?netherite(?![\w/-])/
const files = ['README.md']
const walk = (dir) => {
  for (const name of readdirSync(join(root, dir))) {
    const path = join(dir, name)
    if (statSync(join(root, path)).isDirectory()) walk(path)
    else if (name.endsWith('.md')) files.push(path)
  }
}
walk('docs')

const problems = []
for (const file of files) {
  readFileSync(join(root, file), 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (bare.test(line)) problems.push(`${file}:${i + 1}: ${line.trim()}`)
    })
}
if (problems.length > 0) {
  console.error('Use `npx @vicentelyrio/netherite`, not `npx netherite`:')
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(`npx name: ${files.length} pages ok`)
