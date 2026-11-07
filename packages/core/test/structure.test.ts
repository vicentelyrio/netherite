// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, test } from 'vitest'

const packages = join(import.meta.dirname, '../..')
const names = ['api', 'cli', 'core', 'git', 'markdown', 'mcp', 'schema', 'server', 'tokens']

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

const sources = names.flatMap((name) =>
  walk(join(packages, name, 'src')).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts')),
)
const shown = (file: string) => relative(packages, file)
const maxLines = 200
const entryPoints = new Set(['index.ts', 'bin.ts'])
const stillTooLong = new Set([
  'core/src/index.ts',
  'core/src/lint/lint.ts',
  'core/src/ops/import/importBatch.ts',
  'core/src/period-stats/periodStats.ts',
  'core/src/survey/surveyRepository.ts',
  'core/src/watch/watchRepo.ts',
  'core/src/workspace-index/createIndex.ts',
  'git/src/git/openGit.ts',
  'server/src/handlers/items.ts',
])

describe('the structure of the packages', () => {
  test('nothing uses a switch: a table of strategies says the same in less', () => {
    const found = sources.filter((f) => /\bswitch\s*\(/.test(read(f))).map(shown)
    expect(found).toEqual([])
  })

  test('only entry points sit at the root of a package', () => {
    const loose = names.flatMap((name) =>
      readdirSync(join(packages, name, 'src'))
        .filter((f) => statSync(join(packages, name, 'src', f)).isFile())
        .filter((f) => !entryPoints.has(f))
        .map((f) => `${name}/${f}`),
    )
    expect(loose).toEqual([])
  })

  test('every folder of source has an entry point', () => {
    const folders = new Set(
      names.flatMap((n) =>
        readdirSync(join(packages, n, 'src'))
          .filter((f) => statSync(join(packages, n, 'src', f)).isDirectory())
          .map((f) => join(packages, n, 'src', f)),
      ),
    )
    const missing = [...folders].filter((f) => !readdirSync(f).includes('index.ts')).map(shown)
    expect(missing).toEqual([])
  })

  test('files stay small, and the ones still too long do not grow in number', () => {
    const long = sources
      .filter((f) => read(f).split('\n').length > maxLines)
      .map(shown)
      .filter((f) => !stillTooLong.has(f))
    expect(long).toEqual([])
  })
})

function read(file: string) {
  return readFileSync(file, 'utf8')
}
