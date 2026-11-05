import type { KnowledgeRow } from '@netherite/api'

export type SortKey = 'id' | 'title' | 'freshness' | 'date'

export interface Filters {
  readonly type: string
  readonly status: string
  readonly project: string
  readonly tag: string
  readonly stale: boolean
  readonly orphans: boolean
  readonly sort: SortKey
  readonly q: string
}

export const noFilters: Filters = {
  type: 'all',
  status: '',
  project: '',
  tag: '',
  stale: false,
  orphans: false,
  sort: 'date',
  q: '',
}

const freshnessRank = { stale: 0, drifting: 1, unknown: 2, fresh: 3 } as const

export const filterKnowledge = (rows: ReadonlyArray<KnowledgeRow>, f: Filters): KnowledgeRow[] =>
  rows
    .filter(
      (r) =>
        (f.type === 'all' || r.type === f.type) &&
        (f.status === '' || r.status === f.status) &&
        (f.project === '' || r.projects.includes(f.project)) &&
        (f.tag === '' || r.tags.includes(f.tag)) &&
        (!f.stale || r.freshness === 'stale' || r.freshness === 'drifting') &&
        (!f.orphans || r.orphan) &&
        (f.q.trim() === '' ||
          `${r.id} ${r.title} ${r.path}`.toLowerCase().includes(f.q.trim().toLowerCase())),
    )
    .sort((a, b) => {
      switch (f.sort) {
        case 'title':
          return a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
        case 'freshness': {
          const ra = a.freshness === null ? 4 : freshnessRank[a.freshness]
          const rb = b.freshness === null ? 4 : freshnessRank[b.freshness]
          return ra - rb || a.id.localeCompare(b.id)
        }
        case 'date':
          return (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id)
        default:
          return a.id.localeCompare(b.id)
      }
    })

export const typeCounts = (rows: ReadonlyArray<KnowledgeRow>, f: Filters) => {
  const base = filterKnowledge(rows, { ...f, type: 'all' })
  const counts: Record<string, number> = { all: base.length }
  for (const r of base) counts[r.type] = (counts[r.type] ?? 0) + 1
  return counts
}
