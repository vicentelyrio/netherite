import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { defaultConfig } from '@netherite/schema'
import { generateWorkspaceFiles, withTempDir } from '@netherite/testing'
import { Effect, Layer } from 'effect'
import { describe, expect, test } from 'vitest'
import {
  createIndex,
  type Diagnostic,
  lint,
  lintWorkspace,
  openWorkspace,
  type RuleId,
  type ScannedItem,
  summarize,
  toScannedItem,
} from '../src/index'
import { fixturePath, scanFixture } from './helpers'

const run = (items: ReadonlyArray<ScannedItem>, only?: string[]) => {
  const index = createIndex({ config: defaultConfig })
  index.build(items)
  return lint(index, { config: defaultConfig, contentRoot: 'n', ...(only ? { only } : {}) })
}

const file = (front: string, body = '') => `---\n${front.trim()}\n---\n\n${body}\n`
const item = (path: string, front: string, body?: string) => toScannedItem(path, file(front, body))
const doc = (id: string, extra = '') =>
  `id: ${id}\naliases: [${id}]\ntype: doc\ntitle: T ${id}\n${extra}`

const rules = (diagnostics: ReadonlyArray<Diagnostic>) => diagnostics.map((d) => d.rule)
const only = (diagnostics: ReadonlyArray<Diagnostic>, rule: RuleId) =>
  diagnostics.filter((d) => d.rule === rule)

describe('fixtures/basic', () => {
  const expected = JSON.parse(readFileSync(join(fixturePath('basic'), 'expected.json'), 'utf8'))

  test('gives exactly the diagnostics the fixture lists, with positions', async () => {
    const index = createIndex({ config: defaultConfig })
    index.build(await scanFixture())
    const found = lint(index, { config: defaultConfig, contentRoot: 'netherite' })
    expect(
      found.map(({ path, line, column, rule, severity }) => ({
        path,
        line,
        column,
        rule,
        severity,
      })),
    ).toEqual(expected.lint)
  })

  test('every diagnostic has the machine-readable shape', async () => {
    const index = createIndex({ config: defaultConfig })
    index.build(await scanFixture())
    for (const d of lint(index, { config: defaultConfig, contentRoot: 'netherite' })) {
      expect(d).toMatchObject({
        path: expect.any(String),
        line: expect.any(Number),
        column: expect.any(Number),
        rule: expect.any(String),
        severity: expect.stringMatching(/^(error|warning|info)$/),
        message: expect.any(String),
      })
      expect(d.line).toBeGreaterThanOrEqual(1)
      expect(d.column).toBeGreaterThanOrEqual(1)
    }
  })

  test('the orphan list matches the fixture', async () => {
    const index = createIndex({ config: defaultConfig })
    index.build(await scanFixture())
    const diagnostics = lint(index, { config: defaultConfig, contentRoot: 'netherite' })
    expect(only(diagnostics, 'orphan').map((d) => d.path.split('/').pop()?.slice(0, 9))).toEqual(
      expected.orphans,
    )
  })

  test('lintWorkspace reads the fixture from disk and gives the same result', async () => {
    const layer = Layer.merge(NodeFileSystem.layer, NodePath.layer)
    const found = await withTempDir('basic', (dir) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const workspace = yield* openWorkspace(dir)
          return yield* lintWorkspace(workspace)
        }).pipe(Effect.provide(layer)),
      ),
    )
    expect(found.map((d) => `${d.rule}:${d.path.split('/').pop()}`)).toEqual(
      expected.lint.map((d: Diagnostic) => `${d.rule}:${d.path.split('/').pop()}`),
    )
    expect(summarize(found)).toEqual({ error: 7, warning: 1, info: 1 })
  })
})

describe('frontmatter', () => {
  test('a file without frontmatter is an error and gets no other diagnostics', () => {
    const found = run([toScannedItem('n/tasks/plain.md', '# Just text\n')])
    expect(found).toMatchObject([{ rule: 'frontmatter', severity: 'error', line: 1, column: 1 }])
  })

  test('invalid YAML reports its line', () => {
    const found = run([toScannedItem('n/docs/a.md', '---\nid: ok\ntitle: [oops\n---\n')])
    expect(found[0]).toMatchObject({ rule: 'frontmatter', severity: 'error' })
    expect(found[0]?.line).toBeGreaterThanOrEqual(3)
    expect(found[0]?.message).toContain('Invalid YAML')
  })

  test('frontmatter that is a list is an error', () => {
    const found = run([toScannedItem('n/docs/a.md', '---\n- a\n- b\n---\n')])
    expect(rules(found)).toEqual(['frontmatter'])
  })
})

describe('schema', () => {
  test('each problem points at its field', () => {
    const found = run([
      item(
        'n/docs/DOC-00001-a.md',
        'id: DOC-00001\naliases: [DOC-00001]\ntype: doc\ntitle: ""\nowner: ada',
      ),
    ])
    expect(only(found, 'schema').map((d) => [d.line, d.message.split(':')[0]])).toEqual([
      [5, 'title'],
      [6, 'owner'],
    ])
  })

  test('a missing required field points at the top of the frontmatter', () => {
    const found = run([
      item('n/docs/DOC-00001-a.md', 'id: DOC-00001\naliases: [DOC-00001]\ntype: doc'),
    ])
    expect(only(found, 'schema')[0]).toMatchObject({ line: 1, column: 1 })
    expect(only(found, 'schema')[0]?.message).toContain('title')
  })

  test('an unknown type is a schema error on the type field', () => {
    const found = run([item('n/docs/x.md', 'id: X-1\naliases: [X-1]\ntype: epic\ntitle: T')])
    expect(only(found, 'schema')[0]).toMatchObject({ line: 4 })
  })
})

describe('identity', () => {
  test('duplicate ids are reported on every file that uses them', () => {
    const found = run([
      item('n/docs/DOC-00001-a.md', doc('DOC-00001', 'owner: "@a"'), 'x'),
      item('n/docs/DOC-00001-b.md', doc('DOC-00001', 'owner: "@a"'), 'y'),
    ])
    const dupes = only(found, 'duplicate-id')
    expect(dupes.map((d) => d.path)).toEqual(['n/docs/DOC-00001-a.md', 'n/docs/DOC-00001-b.md'])
    expect(dupes[0]?.message).toContain('n/docs/DOC-00001-b.md')
    expect(dupes[0]?.line).toBe(2)
  })

  test('aliases must include the id, and the fix adds it', () => {
    const found = run([
      item('n/docs/DOC-00001-a.md', 'id: DOC-00001\naliases: [other]\ntype: doc\ntitle: T'),
    ])
    expect(only(found, 'missing-alias')).toMatchObject([
      {
        severity: 'error',
        line: 3,
        fix: { kind: 'add-alias', path: 'n/docs/DOC-00001-a.md', alias: 'DOC-00001' },
      },
    ])
  })

  test('an empty aliases list is missing the id too', () => {
    const found = run([
      item('n/docs/DOC-00001-a.md', 'id: DOC-00001\naliases: []\ntype: doc\ntitle: T'),
    ])
    expect(rules(found)).toContain('missing-alias')
  })

  test('the file name must start with the id, and the fix renames it', () => {
    const found = run([
      item('n/docs/DOC-00002-old-slug.md', doc('DOC-00009')),
      item('n/docs/notes.md', doc('DOC-00010')),
    ])
    const names = only(found, 'file-name-id')
    expect(names).toMatchObject([
      {
        severity: 'warning',
        fix: {
          kind: 'rename-file',
          path: 'n/docs/DOC-00002-old-slug.md',
          to: 'n/docs/DOC-00009-old-slug.md',
        },
      },
      { fix: { kind: 'rename-file', path: 'n/docs/notes.md', to: 'n/docs/DOC-00010-notes.md' } },
    ])
  })

  test('there is no rename fix when the new name is taken', () => {
    const found = run([
      item('n/docs/DOC-00002-x.md', doc('DOC-00009')),
      item('n/docs/DOC-00009-x.md', doc('DOC-00009')),
    ])
    const name = only(found, 'file-name-id')[0]
    expect(name?.path).toBe('n/docs/DOC-00002-x.md')
    expect(name).not.toHaveProperty('fix')
  })

  test('a file named exactly the id is fine', () => {
    expect(
      rules(run([item('n/docs/DOC-00001.md', doc('DOC-00001', 'owner: "@a"'))])),
    ).not.toContain('file-name-id')
  })
})

describe('folders', () => {
  test('an item outside its type folder is a warning', () => {
    const found = run([item('n/tasks/DOC-00001-a.md', doc('DOC-00001'))])
    expect(only(found, 'outside-type-folder')).toMatchObject([
      { severity: 'warning', line: 4, message: 'A doc belongs in n/docs/' },
    ])
  })

  test('files outside the content root are not checked', () => {
    expect(rules(run([item('elsewhere/DOC-00001-a.md', doc('DOC-00001'))]))).not.toContain(
      'outside-type-folder',
    )
  })
})

describe('links', () => {
  const target = item('n/docs/DOC-00002-b.md', doc('DOC-00002'), '# Part one\n\ntext')

  test('a body link that matches nothing is an error at the link', () => {
    const found = run([
      item('n/docs/DOC-00001-a.md', doc('DOC-00001'), 'first line\nsee [[NOPE-1]] here'),
    ])
    expect(only(found, 'broken-link')).toMatchObject([
      { severity: 'error', line: 9, column: 5, message: '[[NOPE-1]] does not match any item' },
    ])
  })

  test('a frontmatter reference that matches nothing points at the field', () => {
    const found = run([
      item(
        'n/tasks/TASK-00001-a.md',
        'id: TASK-00001\naliases: [TASK-00001]\ntype: task\ntitle: T\nproject: PRJ-00404\nstate: backlog',
      ),
    ])
    expect(only(found, 'broken-link')).toMatchObject([
      { line: 6, message: 'project: PRJ-00404 does not match any item' },
    ])
  })

  test('a shared title is a warning; a shared id is an error', () => {
    const items = [
      item('n/docs/DOC-00003-a.md', 'id: DOC-00003\naliases: [DOC-00003]\ntype: doc\ntitle: Same'),
      item('n/docs/DOC-00004-b.md', 'id: DOC-00004\naliases: [DOC-00004]\ntype: doc\ntitle: Same'),
      item('n/docs/DOC-00001-c.md', doc('DOC-00001'), 'by title [[Same]] and by id [[DOC-00005]]'),
      item('n/docs/DOC-00005-d.md', doc('DOC-00005')),
      item('n/docs/DOC-00005-e.md', doc('DOC-00005')),
    ]
    const found = only(run(items), 'ambiguous-link')
    expect(found.map((d) => [d.severity, d.message.split(' matches')[0]])).toEqual([
      ['warning', '[[Same]]'],
      ['error', '[[DOC-00005]]'],
    ])
  })

  test('a link to a missing heading is a warning', () => {
    const found = run([
      target,
      item('n/docs/DOC-00001-a.md', doc('DOC-00001'), '[[DOC-00002#Part one]] [[DOC-00002#Nope]]'),
    ])
    expect(only(found, 'broken-heading')).toMatchObject([
      { severity: 'warning', message: expect.stringContaining('#Nope') },
    ])
  })

  test('resolved links produce nothing', () => {
    const found = run([
      target,
      item('n/docs/DOC-00001-a.md', doc('DOC-00001'), '[[DOC-00002]] [[DOC-00002|label]]'),
    ])
    expect(rules(found).filter((r) => r.includes('link'))).toEqual([])
  })
})

describe('orphans and unknown fields', () => {
  test('a context item given to agents is not an orphan, since sync uses it; one that is not, is', () => {
    const ctx = (id: string, extra: string) =>
      item(
        `n/context/${id}-x.md`,
        `id: ${id}\naliases: [${id}]\ntype: context\ntitle: T ${id}\n${extra}`,
      )
    const found = run([
      ctx('CTX-00001', 'include_in_context: true'),
      ctx('CTX-00002', 'include_in_context: false'),
    ])
    expect(only(found, 'orphan').map((d) => d.path)).toEqual(['n/context/CTX-00002-x.md'])
  })

  test('an orphan is info', () => {
    const found = run([item('n/docs/DOC-00001-a.md', doc('DOC-00001'))])
    expect(only(found, 'orphan')).toMatchObject([{ severity: 'info', line: 1, column: 1 }])
  })

  test('linked items and non-knowledge items are not orphans', () => {
    const found = run([
      item('n/docs/DOC-00001-a.md', doc('DOC-00001'), '[[DOC-00002]]'),
      item('n/docs/DOC-00002-b.md', doc('DOC-00002')),
      item(
        'n/goals/GOAL-00001-g.md',
        'id: GOAL-00001\naliases: [GOAL-00001]\ntype: goal\ntitle: G\nstatus: active',
      ),
    ])
    expect(only(found, 'orphan').map((d) => d.path)).toEqual(['n/docs/DOC-00001-a.md'])
  })

  test('an unknown field is info at its key, and does not fail the item', () => {
    const found = run([
      item('n/docs/DOC-00001-a.md', doc('DOC-00001', 'custom_field: 1\nanother: x')),
    ])
    expect(only(found, 'unknown-field')).toMatchObject([
      { severity: 'info', line: 6, message: 'Unknown field "custom_field" (kept as is)' },
      { severity: 'info', line: 7 },
    ])
    expect(only(found, 'schema')).toEqual([])
  })
})

describe('results', () => {
  test('are sorted by path, then position', () => {
    const found = run([
      item('n/docs/DOC-00002-b.md', doc('DOC-00002', 'zzz: 1\naaa: 2')),
      item('n/docs/DOC-00001-a.md', doc('DOC-00001', 'zzz: 1')),
    ])
    const order = found.map((d) => `${d.path.split('/').pop()}:${d.line}`)
    expect(order).toEqual([...order].sort())
  })

  test('`only` limits the report to some paths but rules still see everything', () => {
    const items = [
      item('n/docs/DOC-00001-a.md', doc('DOC-00001'), '[[DOC-00002]]'),
      item('n/docs/DOC-00002-b.md', doc('DOC-00002')),
      item('n/docs/DOC-00002-c.md', doc('DOC-00002')),
    ]
    const found = run(items, ['n/docs/DOC-00001-a.md'])
    expect(new Set(found.map((d) => d.path))).toEqual(new Set(['n/docs/DOC-00001-a.md']))
    expect(rules(found)).toContain('ambiguous-link')
  })

  test('summarize counts by severity', () => {
    expect(
      summarize([
        { severity: 'error' },
        { severity: 'error' },
        { severity: 'info' },
      ] as Diagnostic[]),
    ).toEqual({ error: 2, warning: 0, info: 1 })
  })

  test('a generated workspace of valid files has no errors or warnings', () => {
    const items = Object.entries(generateWorkspaceFiles({ count: 400, seed: 11 })).map(([p, t]) =>
      toScannedItem(p, t),
    )
    const index = createIndex({ config: defaultConfig })
    index.build(items)
    const found = lint(index, { config: defaultConfig, contentRoot: 'netherite' })
    expect(found.filter((d) => d.severity !== 'info')).toEqual([])
  })
})

describe('dates and horizons', () => {
  const goal = (extra: string) =>
    item(
      'n/goals/GOAL-00001-g.md',
      `id: GOAL-00001\naliases: [GOAL-00001]\ntype: goal\ntitle: G\nstatus: active\n${extra}`,
    )
  const project = (extra: string) =>
    item(
      'n/projects/PRJ-00001-p.md',
      `id: PRJ-00001\naliases: [PRJ-00001]\ntype: project\ntitle: P\ngoals: [GOAL-00001]\nstatus: active\n${extra}`,
    )

  test('a due date before the creation date is reported', () => {
    const found = only(
      run([goal('created: 2026-05-01T10:00:00Z\ndue: 2026-04-30')]),
      'due-before-created',
    )
    expect(found).toHaveLength(1)
    expect(
      only(run([goal('created: 2026-05-01T10:00:00Z\ndue: 2026-05-01')]), 'due-before-created'),
    ).toEqual([])
  })

  test('a milestone without a due date is reported on projects only', () => {
    expect(only(run([project('milestone: Beta')]), 'milestone-without-due')).toHaveLength(1)
    expect(
      only(run([project('milestone: Beta\ndue: 2026-09-01')]), 'milestone-without-due'),
    ).toEqual([])
  })

  test('a horizon must be forever or a length', () => {
    for (const ok of ['forever', '10 years', '6 months', '2 weeks', '90d', '10y'])
      expect(only(run([goal(`horizon: ${ok}`)]), 'invalid-horizon')).toEqual([])
    for (const bad of ['someday', 'ten years', '0 days'])
      expect(only(run([goal(`horizon: ${bad}`)]), 'invalid-horizon')).toHaveLength(1)
  })
})
