import type { KnowledgeRow } from '@netherite/api'

export interface Transition {
  readonly id: string
  readonly field: string
  readonly from?: unknown
  readonly to?: unknown
  readonly kind: string
  readonly hash: string
  readonly date: string
  readonly author: { readonly name: string }
}

export interface Change {
  readonly id: string
  readonly title: string
  readonly from: string | undefined
  readonly to: string
  /** The ADR that replaced this one, when this change is its supersession. */
  readonly note: string | undefined
  /** This change follows another in the same commit that is the one replacing it. */
  readonly link: boolean
}

export interface CommitCardData {
  readonly hash: string
  readonly date: string
  readonly author: string
  readonly changes: ReadonlyArray<Change>
}

export interface Lane {
  readonly project: string
  /** The project's name, for the lane's heading; its id when the name is not known. */
  readonly title: string
  readonly adrs: number
  readonly chains: number
  /** Newest first. */
  readonly commits: ReadonlyArray<CommitCardData>
}

export const noProject = 'No project'

/**
 * One lane per project: every status change of its ADRs, grouped by the commit that made it,
 * newest first. An ADR in two projects shows in both lanes; one in none is in "No project", last.
 */
export const lanesOf = (
  rows: ReadonlyArray<KnowledgeRow>,
  transitions: ReadonlyArray<Transition>,
  only = '',
  titles: ReadonlyMap<string, string> = new Map(),
): Lane[] => {
  const adrs = rows.filter((r) => r.type === 'adr')
  const byId = new Map(adrs.map((r) => [r.id, r]))
  const lanes = new Map<string, KnowledgeRow[]>()
  for (const adr of adrs) {
    for (const project of adr.projects.length === 0 ? [noProject] : adr.projects) {
      lanes.set(project, [...(lanes.get(project) ?? []), adr])
    }
  }
  return [...lanes]
    .filter(([project]) => only === '' || project === only)
    .sort(([a], [b]) => (a === noProject ? 1 : b === noProject ? -1 : a.localeCompare(b)))
    .map(([project, list]) => {
      const ids = new Set(list.map((a) => a.id))
      const mine = transitions.filter(
        (t) => t.field === 'status' && t.kind !== 'seen' && ids.has(t.id),
      )
      const commits = new Map<string, Transition[]>()
      for (const t of mine) commits.set(t.hash, [...(commits.get(t.hash) ?? []), t])
      const cards: CommitCardData[] = [...commits.values()]
        .map((group) => {
          const ids = new Set(group.map((t) => t.id))
          const first = group[0] as Transition
          const changes = [...group]
            .sort((a, b) => {
              // The ADR that replaces another comes first, so "supersedes" reads downward.
              const rank = (t: Transition) => (t.to === 'superseded' ? 1 : 0)
              return rank(a) - rank(b) || a.id.localeCompare(b.id)
            })
            .map((t): Change => {
              const row = byId.get(t.id)
              const by = row?.supersededBy[0]
              return {
                id: t.id,
                title: row?.title ?? t.id,
                from: typeof t.from === 'string' ? t.from : undefined,
                to: typeof t.to === 'string' ? t.to : '',
                note: t.to === 'superseded' && by !== undefined ? `by ${by}` : undefined,
                link: t.to === 'superseded' && by !== undefined && ids.has(by),
              }
            })
          return { hash: first.hash, date: first.date, author: first.author.name, changes }
        })
        .sort((a, b) => b.date.localeCompare(a.date))
      const chains = list.filter((a) => a.supersedes.length > 0).length
      return {
        project,
        title: titles.get(project) ?? project,
        adrs: list.length,
        chains,
        commits: cards,
      }
    })
}

/** The words for an ADR status, from the catalog; an unknown status shows as it is. */
export const statusLabel = (
  LL: { decisions: { status: Record<string, () => string> } },
  status: string,
) => LL.decisions.status[status]?.() ?? status

export const statusStyle: Record<string, { label: string; color: string; icon: string }> = {
  proposed: { label: 'Proposed', color: '#a5a7ff', icon: 'pending' },
  accepted: { label: 'Accepted', color: '#2cc27e', icon: 'check_circle' },
  deprecated: { label: 'Deprecated', color: '#f0717e', icon: 'block' },
  superseded: { label: 'Superseded', color: '#969ab8', icon: 'swap_horiz' },
}
