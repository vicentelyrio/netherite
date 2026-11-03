import { describe, expect, test } from 'vitest'
import { arrange, groupOf, type SearchHit, targetOf } from '@/features/search'

const hit = (id: string, type: string, extra: Partial<SearchHit> = {}): SearchHit => ({
  id,
  type,
  title: `Title ${id}`,
  path: `${id}.md`,
  score: 1,
  ...extra,
})

describe('search results', () => {
  const hits = [
    hit('TASK-00001', 'task', { project: 'PRJ-00001' }),
    hit('ADR-00001', 'adr'),
    hit('RUN-00001', 'runbook'),
    hit('DOC-00001', 'doc'),
    hit('PRJ-00001', 'project'),
    hit('GOAL-00001', 'goal'),
    hit('CTX-00001', 'context'),
  ]

  test('docs and runbooks share a group', () => {
    expect(groupOf('runbook')).toBe('doc')
    expect(groupOf('doc')).toBe('doc')
    expect(groupOf('task')).toBe('task')
  })

  test('are arranged in the palette order, keeping the ranking inside each group', () => {
    const groups = arrange(hits, 'all')
    expect(groups.map((g) => g.name)).toEqual([
      'Decisions',
      'Tasks',
      'Docs & runbooks',
      'AI context',
      'Projects',
      'Goals',
    ])
    expect(groups[2]?.rows.map((r) => r.id)).toEqual(['RUN-00001', 'DOC-00001'])
  })

  test('narrow to a type, leaving nothing else', () => {
    expect(arrange(hits, 'adr').flatMap((g) => g.rows.map((r) => r.id))).toEqual(['ADR-00001'])
    expect(arrange(hits, 'doc').flatMap((g) => g.rows.map((r) => r.id))).toEqual([
      'RUN-00001',
      'DOC-00001',
    ])
  })

  test('go to the right page: goals and projects to their own, a task to its drawer, the rest to the item', () => {
    expect(targetOf(hit('GOAL-00001', 'goal'))).toEqual({
      to: '/goals/$id',
      params: { id: 'GOAL-00001' },
    })
    expect(targetOf(hit('PRJ-00001', 'project'))).toEqual({
      to: '/projects/$id',
      params: { id: 'PRJ-00001' },
    })
    expect(targetOf(hits[0] as SearchHit)).toEqual({
      to: '/projects/$id',
      params: { id: 'PRJ-00001' },
      search: { task: 'TASK-00001' },
    })
    expect(targetOf(hit('ADR-00001', 'adr'))).toEqual({
      to: '/items/$id',
      params: { id: 'ADR-00001' },
    })
    expect(targetOf(hit('ADR-00001', 'adr'), true)).toEqual({
      to: '/items/$id',
      params: { id: 'ADR-00001' },
      search: { mode: 'split' },
    })
    expect(targetOf(hit('TASK-00009', 'task'))).toEqual({
      to: '/items/$id',
      params: { id: 'TASK-00009' },
    })
  })
})
