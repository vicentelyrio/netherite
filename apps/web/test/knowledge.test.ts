import type { KnowledgeRow } from '@netherite/api'
import { describe, expect, test } from 'vitest'
import { filterKnowledge, noFilters, typeCounts } from '../src/pages/knowledge'

const row = (id: string, extra: Partial<KnowledgeRow> = {}): KnowledgeRow => ({
  id,
  type: id.startsWith('ADR') ? 'adr' : 'doc',
  title: `Title ${id}`,
  path: `${id}.md`,
  projects: [],
  tags: [],
  freshness: null,
  orphan: false,
  ...extra,
})

const rows = [
  row('ADR-00001', { status: 'accepted', projects: ['PRJ-00001'], date: '2026-01-01' }),
  row('ADR-00002', { status: 'proposed', date: '2026-03-01' }),
  row('DOC-00001', { freshness: 'stale', tags: ['ops'], projects: ['PRJ-00001'] }),
  row('DOC-00002', { freshness: 'fresh', orphan: true, date: '2026-02-01' }),
  row('DOC-00003', { freshness: 'drifting', tags: ['ops'] }),
]
const ids = (f: Partial<typeof noFilters>) =>
  filterKnowledge(rows, { ...noFilters, ...f }).map((r) => r.id)

describe('filtering knowledge', () => {
  test('type, status, project and tag each narrow the list, and together they all apply', () => {
    expect(ids({ type: 'adr' })).toEqual(['ADR-00001', 'ADR-00002'])
    expect(ids({ status: 'proposed' })).toEqual(['ADR-00002'])
    expect(ids({ project: 'PRJ-00001' })).toEqual(['ADR-00001', 'DOC-00001'])
    expect(ids({ tag: 'ops' })).toEqual(['DOC-00001', 'DOC-00003'])
    expect(ids({ project: 'PRJ-00001', tag: 'ops' })).toEqual(['DOC-00001'])
  })

  test('Stale shows drifting and stale items, Orphans only items nothing links to', () => {
    expect(ids({ stale: true })).toEqual(['DOC-00001', 'DOC-00003'])
    expect(ids({ orphans: true })).toEqual(['DOC-00002'])
  })

  test('sorts by ID, title, stalest first, or newest first with undated items last', () => {
    expect(ids({ sort: 'freshness' })).toEqual([
      'DOC-00001',
      'DOC-00003',
      'DOC-00002',
      'ADR-00001',
      'ADR-00002',
    ])
    expect(ids({ sort: 'date' })).toEqual([
      'ADR-00002',
      'DOC-00002',
      'ADR-00001',
      'DOC-00001',
      'DOC-00003',
    ])
    expect(ids({ sort: 'title' })[0]).toBe('ADR-00001')
  })

  test('tab counts follow the other filters but not the tab itself', () => {
    expect(typeCounts(rows, noFilters)).toEqual({ all: 5, adr: 2, doc: 3 })
    expect(typeCounts(rows, { ...noFilters, type: 'adr', tag: 'ops' })).toEqual({ all: 2, doc: 2 })
  })
})
