import { defaultConfig } from '@netherite/schema'
import { describe, expect, test } from 'vitest'
import { createIndex, type ScannedItem, toScannedItem } from '../src/index'
import { itemFile, itemsFrom, scanFixture } from './helpers'

const build = (items: ReadonlyArray<ScannedItem>) => {
  const index = createIndex({ config: defaultConfig })
  index.build(items)
  return index
}

const fixtureIndex = async () => build(await scanFixture())
const p = (name: string) => `netherite/${name}`
const base = (path: string) => path.split('/').pop()

describe('fixtures/basic', () => {
  test('indexes every file', async () => {
    const index = await fixtureIndex()
    expect(index.size()).toBe(17)
    expect(index.graph.order).toBe(17)
  })

  test('typed edges follow the frontmatter', async () => {
    const index = await fixtureIndex()
    const edges = (path: string) =>
      index
        .outgoing(path)
        .map((e) => `${e.kind}:${base(e.to)?.split('-').slice(0, 2).join('-')}`)
        .sort()

    expect(edges(p('projects/PRJ-00001-sample-app.md'))).toEqual([
      'belongs_to:GOAL-00001',
      'implements:ADR-00002',
      'reference:ADR-00002',
      'reference:ADR-00003',
      'reference:DOC-00001',
    ])
    expect(edges(p('tasks/TASK-00002-add-the-cli.md'))).toEqual([
      'belongs_to:PRJ-00001',
      'related:RUN-00001',
    ])
    expect(edges(p('adr/ADR-00002-use-promises.md'))).toEqual([
      'reference:ADR-00001',
      'supersedes:ADR-00001',
    ])
  })

  test('supersession is one edge, whichever ADR states it', async () => {
    const index = await fixtureIndex()
    const supersedes = index.graph
      .edges()
      .filter((e) => index.graph.getEdgeAttribute(e, 'kind') === 'supersedes')
    expect(supersedes).toHaveLength(1)
    expect(index.graph.source(supersedes[0] as string)).toBe(p('adr/ADR-00002-use-promises.md'))
    expect(index.graph.target(supersedes[0] as string)).toBe(p('adr/ADR-00001-use-callbacks.md'))
  })

  test('backlinks list everything that points at an item', async () => {
    const index = await fixtureIndex()
    const from = (path: string) => index.backlinks(path).map((e) => base(e.from))
    expect(from(p('context/CTX-00001-conventions.md'))).toEqual(['DOC-00001-app-overview.md'])
    expect(from(p('adr/ADR-00001-use-callbacks.md')).sort()).toEqual([
      'ADR-00002-use-promises.md',
      'ADR-00002-use-promises.md',
    ])
  })

  test('the only orphan is the doc nothing links to', async () => {
    const index = await fixtureIndex()
    expect(index.orphans()).toEqual([p('docs/DOC-00002-orphan-notes.md')])
    expect(index.isOrphan(p('docs/DOC-00002-orphan-notes.md'))).toBe(true)
    expect(index.isOrphan(p('docs/DOC-00001-app-overview.md'))).toBe(false)
    // Only knowledge can be an orphan.
    expect(index.isOrphan(p('tasks/TASK-00003-publish-the-package.md'))).toBe(false)
  })

  test('unresolved links are the two the fixture is built around, plus the duplicate id', async () => {
    const index = await fixtureIndex()
    const found = index
      .unresolved()
      .map((u) => `${base(u.path)} -> ${u.ref.target}: ${u.resolution.status}`)
      .sort()
    expect(found).toEqual([
      'DOC-00001-app-overview.md -> TASK-00001: ambiguous',
      'TASK-00002-add-the-cli.md -> TASK-00001: ambiguous',
      'TASK-00090-broken-link.md -> TASK-00404: broken',
    ])
  })

  test('progress: a task counts its checklist', async () => {
    const index = await fixtureIndex()
    expect(index.progress(p('tasks/TASK-00002-add-the-cli.md'))).toEqual({ done: 1, total: 3 })
    expect(index.progress(p('tasks/TASK-00001-build-the-core.md'))).toEqual({ done: 2, total: 2 })
    expect(index.progress(p('docs/DOC-00001-app-overview.md'))).toBeUndefined()
  })

  test('progress: projects and goals count tasks in a done state', async () => {
    const index = await fixtureIndex()
    expect(index.progress(p('projects/PRJ-00001-sample-app.md'))).toEqual({ done: 1, total: 7 })
    expect(index.progress(p('goals/GOAL-00001-ship-first-release.md'))).toEqual({
      done: 1,
      total: 7,
    })
  })

  test('items can be found by id, and duplicates return both', async () => {
    const index = await fixtureIndex()
    expect(index.findById('ADR-00002')).toHaveLength(1)
    expect(index.findById('TASK-00001')).toHaveLength(2)
    expect(index.findById('TASK-99999')).toEqual([])
  })
})

describe('search', () => {
  test('an exact id ranks first', async () => {
    const index = await fixtureIndex()
    expect(index.search('TASK-00002')[0]?.id).toBe('TASK-00002')
    expect(index.search('ADR-00003')[0]?.id).toBe('ADR-00003')
  })

  test('title words, prefixes and typos match', async () => {
    const index = await fixtureIndex()
    expect(index.search('promises')[0]?.id).toBe('ADR-00002')
    expect(index.search('promi')[0]?.id).toBe('ADR-00002')
    expect(index.search('promisses')[0]?.id).toBe('ADR-00002')
  })

  test('body text is searchable, with hits carrying id, title and type', async () => {
    const index = await fixtureIndex()
    const [hit] = index.search('callbacks nest too deeply')
    expect(hit).toMatchObject({
      id: 'ADR-00002',
      title: 'Use promises for async work',
      type: 'adr',
    })
  })

  test('can be limited to types and to a count', async () => {
    const index = await fixtureIndex()
    const hits = index.search('task', { types: ['adr'] })
    expect(hits.every((h) => h.type === 'adr')).toBe(true)
    expect(index.search('the', { limit: 3 }).length).toBeLessThanOrEqual(3)
  })

  test('no match gives no hits', async () => {
    const index = await fixtureIndex()
    expect(index.search('zzzzqqqq')).toEqual([])
  })
})

describe('incremental updates', () => {
  const doc = (id: string, title: string, body = '') => itemFile({ id, type: 'doc', title }, body)
  const a = toScannedItem('n/a.md', doc('DOC-00001', 'Alpha', 'See [[DOC-00002]].'))
  const b = toScannedItem('n/b.md', doc('DOC-00002', 'Beta', 'Hi'))

  test('adding the target of a broken link resolves it', () => {
    const index = build([a])
    expect(index.unresolved()).toHaveLength(1)
    expect(index.incoming('n/a.md')).toEqual([])

    const { changed } = index.upsert(b)

    expect(index.unresolved()).toEqual([])
    expect(index.outgoing('n/a.md')).toEqual([{ kind: 'reference', from: 'n/a.md', to: 'n/b.md' }])
    expect(changed).toEqual(['n/a.md', 'n/b.md'])
  })

  test('removing a target breaks the links to it', () => {
    const index = build([a, b])
    expect(index.unresolved()).toEqual([])

    const { changed } = index.remove('n/b.md')

    expect(index.unresolved().map((u) => u.path)).toEqual(['n/a.md'])
    expect(index.outgoing('n/a.md')).toEqual([])
    expect(index.size()).toBe(1)
    expect(index.graph.hasNode('n/b.md')).toBe(false)
    expect(changed).toEqual(['n/b.md', 'n/a.md'])
  })

  test('changing an id re-resolves the items that linked to the old one', () => {
    const index = build([a, b])
    index.upsert(toScannedItem('n/b.md', doc('DOC-00009', 'Beta')))

    expect(index.unresolved().map((u) => u.ref.target)).toEqual(['DOC-00002'])
    expect(index.findById('DOC-00002')).toEqual([])
    expect(index.findById('DOC-00009')).toHaveLength(1)
  })

  test('changing only the body keeps the links pointing at it', () => {
    const index = build([a, b])
    const { changed } = index.upsert(toScannedItem('n/b.md', doc('DOC-00002', 'Beta', 'New text')))

    expect(changed).toContain('n/b.md')
    expect(index.outgoing('n/a.md')).toHaveLength(1)
    expect(index.search('New text')[0]?.path).toBe('n/b.md')
  })

  test('a change that makes a link ambiguous removes its edge', () => {
    const index = build([a, b])
    index.upsert(toScannedItem('n/c.md', doc('DOC-00002', 'Copy')))

    expect(index.outgoing('n/a.md')).toEqual([])
    expect(index.unresolved()[0]?.resolution.status).toBe('ambiguous')

    index.remove('n/c.md')
    expect(index.outgoing('n/a.md')).toHaveLength(1)
  })

  test('removing and re-adding a path leaves no stale state', () => {
    const index = build([a, b])
    index.remove('n/a.md')
    index.upsert(a)
    expect(index.graph.size).toBe(1)
    expect(index.unresolved()).toEqual([])
  })

  test('removing an unknown path is a no-op', () => {
    const index = build([a])
    expect(index.remove('nope.md')).toEqual({ changed: [] })
  })

  test('search stays in step with updates, before and after it was first used', () => {
    const index = build([a])
    index.upsert(b) // before the text index exists
    expect(index.search('Beta')[0]?.path).toBe('n/b.md')

    index.upsert(toScannedItem('n/b.md', doc('DOC-00002', 'Gamma'))) // after
    expect(index.search('Gamma')[0]?.path).toBe('n/b.md')
    expect(index.search('Beta')).toEqual([])

    index.remove('n/b.md')
    expect(index.search('Gamma')).toEqual([])
  })

  test('adding items one at a time gives the same result as building from scratch', async () => {
    const items = await scanFixture()
    const incremental = createIndex({ config: defaultConfig })
    for (const item of items) incremental.upsert(item)
    const batch = build(items)

    const snapshot = (index: ReturnType<typeof build>) => ({
      edges: index.graph
        .edges()
        .map(
          (e) =>
            `${index.graph.source(e)}|${index.graph.getEdgeAttribute(e, 'kind')}|${index.graph.target(e)}`,
        )
        .sort(),
      orphans: index.orphans(),
      unresolved: index
        .unresolved()
        .map((u) => `${u.path}|${u.ref.target}|${u.resolution.status}`)
        .sort(),
    })
    expect(snapshot(incremental)).toEqual(snapshot(batch))
  })

  test('the order items are added in does not change the result', () => {
    const items = itemsFrom({
      'n/x.md': doc('DOC-00001', 'X', '[[DOC-00002]] [[DOC-00003]]'),
      'n/y.md': doc('DOC-00002', 'Y', '[[DOC-00001]]'),
      'n/z.md': doc('DOC-00003', 'Z'),
    })
    const edges = (list: ScannedItem[]) => {
      const index = createIndex({ config: defaultConfig })
      for (const item of list) index.upsert(item)
      return index.graph.edges().length
    }
    expect(edges(items)).toBe(3)
    expect(edges([...items].reverse())).toBe(3)
  })
})
