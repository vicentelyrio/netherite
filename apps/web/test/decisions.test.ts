import type { KnowledgeRow } from '@netherite/api'
import { describe, expect, test } from 'vitest'
import { lanesOf, stepsById } from '../src/pages/decisions'

const adr = (id: string, extra: Partial<KnowledgeRow> = {}): KnowledgeRow => ({
  id,
  type: 'adr',
  title: id,
  path: `${id}.md`,
  projects: [],
  tags: [],
  freshness: null,
  orphan: false,
  supersedes: [],
  supersededBy: [],
  ...extra,
})

describe('decision lanes', () => {
  const rows = [
    adr('ADR-00001', { projects: ['PRJ-00002'], date: '2026-01-02' }),
    adr('ADR-00002', { projects: ['PRJ-00001', 'PRJ-00002'], date: '2026-01-01' }),
    adr('ADR-00003'),
    { ...adr('DOC-00001'), type: 'doc', projects: ['PRJ-00001'] },
  ]

  test('make a lane per project, an ADR in each project it belongs to, none for no project last', () => {
    const lanes = lanesOf(rows)
    expect(lanes.map((l) => l.project)).toEqual(['PRJ-00001', 'PRJ-00002', 'No project'])
    expect(lanes[0]?.adrs.map((a) => a.id)).toEqual(['ADR-00002'])
    // Oldest decision first within a lane.
    expect(lanes[1]?.adrs.map((a) => a.id)).toEqual(['ADR-00002', 'ADR-00001'])
    expect(lanes[2]?.adrs.map((a) => a.id)).toEqual(['ADR-00003'])
  })

  test('can be narrowed to one project, and leave out anything that is not an ADR', () => {
    expect(lanesOf(rows, 'PRJ-00001').map((l) => l.project)).toEqual(['PRJ-00001'])
    expect(
      lanesOf(rows)
        .flatMap((l) => l.adrs)
        .some((a) => a.id === 'DOC-00001'),
    ).toBe(false)
  })
})

describe('status steps', () => {
  test('keep only status changes, oldest first', () => {
    const t = (
      id: string,
      field: string,
      to: string,
      date: string,
      kind = 'changed',
      from?: string,
    ) => ({
      id,
      field,
      to,
      from,
      kind,
      date: `${date}T10:00:00Z`,
      author: { name: 'Ada' },
    })
    const steps = stepsById([
      t('ADR-00001', 'status', 'accepted', '2026-02-01', 'changed', 'proposed'),
      t('ADR-00001', 'status', 'proposed', '2026-01-01', 'created'),
      t('ADR-00001', 'tags', 'x', '2026-01-05'),
      t('ADR-00001', 'status', 'accepted', '2026-03-01', 'seen'),
    ])
    expect(steps.get('ADR-00001')?.map((s) => `${s.from}>${s.to}@${s.date}`)).toEqual([
      '>proposed@2026-01-01',
      'proposed>accepted@2026-02-01',
    ])
  })
})
