import { describe, expect, test } from 'vitest'
import { makeResolver } from '../src/index'
import { itemFile, itemsFrom, scanFixture } from './helpers'

const workspace = itemsFrom({
  'netherite/adr/ADR-00001-use-callbacks.md': itemFile(
    { id: 'ADR-00001', aliases: ['ADR-00001', 'Callbacks'], title: 'Use callbacks' },
    '# Use callbacks\n\n## Decision\n\nText\n',
  ),
  'netherite/adr/ADR-00002-use-promises.md': itemFile({
    id: 'ADR-00002',
    aliases: ['ADR-00002'],
    title: 'Use promises',
  }),
  'netherite/docs/DOC-00001-overview.md': itemFile({
    id: 'DOC-00001',
    aliases: ['DOC-00001'],
    title: 'Overview',
  }),
  'netherite/runbooks/RUN-00001-overview.md': itemFile({
    id: 'RUN-00001',
    aliases: ['RUN-00001'],
    title: 'Overview',
  }),
  'netherite/docs/Loose note.md': '# A note with no frontmatter\n',
})
const { resolve } = makeResolver(workspace)

describe('resolution order', () => {
  test('resolves by id', () => {
    const r = resolve('ADR-00002')
    expect(r).toMatchObject({ status: 'resolved', via: 'id' })
    expect(r.status === 'resolved' && r.item.id).toBe('ADR-00002')
  })

  test('resolves by alias when no id matches', () => {
    expect(resolve('Callbacks')).toMatchObject({ status: 'resolved', via: 'alias' })
  })

  test('resolves by file name, ignoring case and extension', () => {
    expect(resolve('adr-00002-use-promises')).toMatchObject({ status: 'resolved', via: 'file' })
    expect(resolve('Loose note.md')).toMatchObject({ status: 'resolved', via: 'file' })
    expect(resolve('LOOSE NOTE')).toMatchObject({ status: 'resolved', via: 'file' })
  })

  test('resolves by title, ignoring case', () => {
    expect(resolve('use PROMISES')).toMatchObject({ status: 'resolved', via: 'title' })
  })

  test('an id beats an alias, a file name and a title', () => {
    const items = itemsFrom({
      'a/DOC-00001-first.md': itemFile({ id: 'DOC-00001', aliases: ['Shared'], title: 'Shared' }),
      'b/Shared.md': itemFile({ id: 'DOC-00002', title: 'DOC-00001' }),
    })
    const r = makeResolver(items).resolve('DOC-00001')
    expect(r).toMatchObject({ status: 'resolved', via: 'id' })
  })

  test('an alias beats a file name and a title', () => {
    const items = itemsFrom({
      'a/one.md': itemFile({ id: 'DOC-00001', aliases: ['two'] }),
      'a/two.md': itemFile({ id: 'DOC-00002' }),
    })
    const r = makeResolver(items).resolve('two')
    expect(r.status === 'resolved' && r.item.id).toBe('DOC-00001')
    expect(r).toMatchObject({ via: 'alias' })
  })

  test('ids and aliases are case-sensitive', () => {
    expect(resolve('adr-00002')).toEqual({ status: 'broken' })
    expect(resolve('adr-00099')).toEqual({ status: 'broken' })
    expect(resolve('callbacks')).toEqual({ status: 'broken' })
  })

  test('trims the target', () => {
    expect(resolve('  ADR-00001 ')).toMatchObject({ status: 'resolved', via: 'id' })
  })
})

describe('ambiguous and broken', () => {
  test('a title shared by two items is ambiguous', () => {
    const r = resolve('Overview')
    expect(r).toMatchObject({ status: 'ambiguous', via: 'title' })
    expect(r.status === 'ambiguous' && r.candidates.map((c) => c.id).sort()).toEqual([
      'DOC-00001',
      'RUN-00001',
    ])
  })

  test('a duplicated id is ambiguous', () => {
    const items = itemsFrom({
      'a/TASK-00001-a.md': itemFile({ id: 'TASK-00001' }),
      'b/TASK-00001-b.md': itemFile({ id: 'TASK-00001' }),
    })
    const r = makeResolver(items).resolve('TASK-00001')
    expect(r).toMatchObject({ status: 'ambiguous', via: 'id' })
  })

  test('the same file listed twice by id and alias counts once', () => {
    const items = itemsFrom({
      'a/x.md': itemFile({ id: 'DOC-00001', aliases: ['DOC-00001', 'DOC-00001'] }),
    })
    expect(makeResolver(items).resolve('DOC-00001')).toMatchObject({ status: 'resolved' })
  })

  test('nothing matching is broken', () => {
    expect(resolve('TASK-00404')).toEqual({ status: 'broken' })
    expect(resolve('')).toEqual({ status: 'broken' })
  })
})

describe('paths', () => {
  const items = itemsFrom({
    'netherite/adr/Same name.md': itemFile({ id: 'ADR-00001' }),
    'netherite/docs/Same name.md': itemFile({ id: 'DOC-00001' }),
  })
  const r = makeResolver(items)

  test('a bare file name shared by two folders is ambiguous', () => {
    expect(r.resolve('Same name')).toMatchObject({ status: 'ambiguous', via: 'file' })
  })

  test('a folder prefix disambiguates', () => {
    const found = r.resolve('docs/Same name')
    expect(found).toMatchObject({ status: 'resolved', via: 'file' })
    expect(found.status === 'resolved' && found.item.id).toBe('DOC-00001')
  })

  test('a path that matches nothing is broken', () => {
    expect(r.resolve('tasks/Same name')).toEqual({ status: 'broken' })
  })
})

describe('headings', () => {
  test('reports whether the target has the heading', () => {
    expect(resolve('ADR-00001', 'Decision')).toMatchObject({
      status: 'resolved',
      headingFound: true,
    })
    expect(resolve('ADR-00001', 'decision')).toMatchObject({ headingFound: true })
    expect(resolve('ADR-00001', 'Nope')).toMatchObject({ status: 'resolved', headingFound: false })
  })

  test('a link without a heading has no headingFound', () => {
    expect(resolve('ADR-00001')).not.toHaveProperty('headingFound')
  })
})

describe('on fixtures/basic', () => {
  test('resolves the links the fixture is built around', async () => {
    const items = await scanFixture()
    const r = makeResolver(items)

    expect(r.resolve('CTX-00001')).toMatchObject({ status: 'resolved', via: 'id' })
    expect(r.resolve('ADR-00002')).toMatchObject({ status: 'resolved', via: 'id' })
    expect(r.resolve('TASK-00404')).toEqual({ status: 'broken' })
    // TASK-00001 exists twice in the fixture on purpose.
    expect(r.resolve('TASK-00001')).toMatchObject({ status: 'ambiguous', via: 'id' })
  })

  test('every body link in the fixture resolves as the expected results say', async () => {
    const items = await scanFixture()
    const r = makeResolver(items)
    const problems = items.flatMap((item) =>
      item.parsed.links
        .map(
          (link) => [item.path, link.target, r.resolve(link.target, link.heading).status] as const,
        )
        .filter(([, , status]) => status !== 'resolved'),
    )
    expect(problems).toEqual([
      ['netherite/docs/DOC-00001-app-overview.md', 'TASK-00001', 'ambiguous'],
      ['netherite/tasks/TASK-00090-broken-link.md', 'TASK-00404', 'broken'],
    ])
  })
})
