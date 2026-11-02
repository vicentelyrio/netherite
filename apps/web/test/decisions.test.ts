import type { KnowledgeRow } from '@netherite/api'
import { describe, expect, test } from 'vitest'
import { lanesOf, type Transition } from '../src/pages/decisions'

const adr = (id: string, extra: Partial<KnowledgeRow> = {}): KnowledgeRow => ({
  id,
  type: 'adr',
  title: `Title ${id}`,
  path: `${id}.md`,
  projects: [],
  tags: [],
  freshness: null,
  orphan: false,
  commits: 0,
  supersedes: [],
  supersededBy: [],
  ...extra,
})

const t = (
  id: string,
  to: string,
  hash: string,
  date: string,
  from?: string,
  kind = 'changed',
): Transition => ({
  id,
  field: 'status',
  to,
  ...(from ? { from } : {}),
  kind,
  hash,
  date: `${date}T10:00:00Z`,
  author: { name: 'Ada' },
})

const rows = [
  adr('ADR-00001', { projects: ['PRJ-00002'], status: 'superseded', supersededBy: ['ADR-00002'] }),
  adr('ADR-00002', { projects: ['PRJ-00001', 'PRJ-00002'], supersedes: ['ADR-00001'] }),
  adr('ADR-00003'),
  { ...adr('DOC-00001'), type: 'doc', projects: ['PRJ-00001'] },
]

describe('decision lanes', () => {
  const none: Transition[] = []

  test('make a lane per project, an ADR in each project it belongs to, none for no project last', () => {
    const lanes = lanesOf(rows, none)
    expect(lanes.map((l) => l.project)).toEqual(['PRJ-00001', 'PRJ-00002', 'No project'])
    expect(lanes.map((l) => l.adrs)).toEqual([1, 2, 1])
  })

  test('count the chains: ADRs that replace another', () => {
    const lanes = lanesOf(rows, none)
    expect(lanes.find((l) => l.project === 'PRJ-00002')?.chains).toBe(1)
    expect(lanes.find((l) => l.project === 'PRJ-00001')?.chains).toBe(1)
  })

  test('can be narrowed to one project, and leave out anything that is not an ADR', () => {
    expect(lanesOf(rows, none, 'PRJ-00001').map((l) => l.project)).toEqual(['PRJ-00001'])
  })
})

describe('the timeline of a lane', () => {
  const transitions = [
    t('ADR-00001', 'proposed', 'aaa1111', '2024-03-12', undefined, 'created'),
    t('ADR-00001', 'accepted', 'bbb2222', '2024-03-20', 'proposed'),
    t('ADR-00002', 'accepted', 'ccc3333', '2026-08-03', 'proposed'),
    t('ADR-00001', 'superseded', 'ccc3333', '2026-08-03', 'accepted'),
    { ...t('ADR-00001', 'accepted', 'zzz', '2026-09-01'), field: 'tags' },
  ]

  test('groups changes by the commit that made them, newest first', () => {
    const lane = lanesOf(rows, transitions).find((l) => l.project === 'PRJ-00002')
    expect(lane?.commits.map((c) => c.hash)).toEqual(['ccc3333', 'bbb2222', 'aaa1111'])
  })

  test('puts the replacing ADR first in a commit and links the replaced one to it', () => {
    const lane = lanesOf(rows, transitions).find((l) => l.project === 'PRJ-00002')
    const commit = lane?.commits[0]
    expect(commit?.changes.map((c) => c.id)).toEqual(['ADR-00002', 'ADR-00001'])
    expect(commit?.changes[1]).toMatchObject({ to: 'superseded', note: 'by ADR-00002', link: true })
    expect(commit?.changes[0]?.link).toBe(false)
  })

  test('keeps only status changes', () => {
    const lane = lanesOf(rows, transitions).find((l) => l.project === 'PRJ-00002')
    expect(lane?.commits.flatMap((c) => c.changes).every((c) => c.to !== '')).toBe(true)
    expect(lane?.commits.some((c) => c.hash === 'zzz')).toBe(false)
  })
})
