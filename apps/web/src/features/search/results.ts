import type { ItemSummary } from '@netherite/api'

export type SearchHit = ItemSummary & {
  readonly score: number
  readonly snippet?: string | undefined
  readonly stale?: boolean | undefined
}

export type Group = 'adr' | 'task' | 'doc' | 'context' | 'project' | 'goal'

export const groupOf = (type: string): Group => (type === 'runbook' ? 'doc' : (type as Group))

const groups: ReadonlyArray<Group> = ['adr', 'task', 'doc', 'context', 'project', 'goal']

export const chips: ReadonlyArray<Group | 'all'> = [
  'all',
  'adr',
  'task',
  'doc',
  'context',
  'project',
  'goal',
]

export const arrange = (hits: ReadonlyArray<SearchHit>, only: Group | 'all') => {
  const shown = hits.filter((h) => only === 'all' || groupOf(h.type) === only)
  return groups
    .map((group) => ({
      group,
      rows: shown.filter((h) => groupOf(h.type) === group),
    }))
    .filter((g) => g.rows.length > 0)
}

export const targetOf = (hit: SearchHit, split = false) => {
  const mode = split ? ({ mode: 'split' } as const) : {}
  if (hit.type === 'goal') return { to: '/goals/$id', params: { id: hit.id } } as const
  if (hit.type === 'project') return { to: '/projects/$id', params: { id: hit.id } } as const
  if (hit.type === 'task' && hit.project !== undefined) {
    return {
      to: '/projects/$id',
      params: { id: hit.project },
      search: { task: hit.id, ...mode },
    } as const
  }
  return { to: '/items/$id', params: { id: hit.id }, ...(split ? { search: mode } : {}) } as const
}
