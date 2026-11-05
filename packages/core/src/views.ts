import { estimateTokens } from './context-bundle'
import type { Freshness } from './freshness'
import { parseHorizon } from './horizon'
import { contentHash } from './ops/hash'
import type { Repo } from './ops/repo'
import type { ScannedItem } from './scanned-item'
import type { EdgeKind } from './workspace-index'

type Fields = Record<string, unknown>

export const fieldsOf = (item: ScannedItem): Fields => {
  const data = item.parsed.frontmatter?.data
  return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Fields) : {}
}

export interface ItemSummary {
  readonly id: string | undefined
  readonly type: string | undefined
  readonly title: string | undefined
  readonly path: string
  readonly status?: string
  readonly state?: string
  readonly project?: string
  readonly labels?: ReadonlyArray<unknown>
}

export const itemSummary = (item: ScannedItem): ItemSummary => {
  const f = fieldsOf(item)
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    path: item.path,
    ...(typeof f.status === 'string' ? { status: f.status } : {}),
    ...(typeof f.state === 'string' ? { state: f.state } : {}),
    ...(typeof f.project === 'string' ? { project: f.project } : {}),
    ...(Array.isArray(f.labels) ? { labels: f.labels } : {}),
  }
}

export interface ItemFilter {
  readonly status?: string | undefined
  readonly project?: string | undefined
  readonly tag?: string | undefined
}

export const matchesFilter = (item: ScannedItem, filter: ItemFilter) => {
  const f = fieldsOf(item)
  if (filter.status !== undefined && f.status !== filter.status && f.state !== filter.status)
    return false
  if (
    filter.project !== undefined &&
    f.project !== filter.project &&
    !(Array.isArray(f.goals) && f.goals.includes(filter.project))
  )
    return false
  if (filter.tag !== undefined) {
    const tags = [
      ...(Array.isArray(f.tags) ? f.tags : []),
      ...(Array.isArray(f.labels) ? f.labels : []),
    ]
    if (!tags.includes(filter.tag)) return false
  }
  return true
}

export interface ListOptions extends ItemFilter {
  readonly type?: string | undefined
  readonly limit?: number
  readonly offset?: number
}

export const listItems = (repo: Repo, options: ListOptions = {}) => {
  const limit = options.limit ?? 50
  const offset = options.offset ?? 0
  const all = repo.index
    .items()
    .filter(
      (item) =>
        (options.type === undefined || item.type === options.type) && matchesFilter(item, options),
    )
    .sort((a, b) => (a.id ?? a.path).localeCompare(b.id ?? b.path))
  return { total: all.length, offset, items: all.slice(offset, offset + limit).map(itemSummary) }
}

export const snippetOf = (body: string, query: string): string | undefined => {
  const q = query.trim().toLowerCase()
  if (q === '') return undefined
  const at = body.toLowerCase().indexOf(q)
  if (at === -1) return undefined
  const from = Math.max(0, at - 36)
  const to = Math.min(body.length, at + q.length + 54)
  const text = body.slice(from, to).replace(/\s+/g, ' ').trim()
  return `${from > 0 ? '…' : ''}${text}${to < body.length ? '…' : ''}`
}

export interface ItemSearchOptions extends ItemFilter {
  readonly types?: ReadonlyArray<string> | undefined
  readonly limit?: number
}

export const searchItems = (repo: Repo, query: string, options: ItemSearchOptions = {}) => {
  const limit = options.limit ?? 20
  const wide = repo.index.search(query, {
    ...(options.types === undefined ? {} : { types: [...options.types] }),
    limit: limit * 10,
  })
  const results = wide
    .flatMap((hit) => {
      const item = repo.index.get(hit.path)
      if (item === undefined || !matchesFilter(item, options)) return []
      const snippet = snippetOf(item.parsed.source.slice(item.parsed.bodyStart), query)
      return [
        {
          ...itemSummary(item),
          score: Math.round(hit.score * 100) / 100,
          ...(snippet === undefined ? {} : { snippet }),
        },
      ]
    })
    .slice(0, limit)
  return { total: results.length, results }
}

export interface LinkView {
  readonly kind: EdgeKind
  readonly id: string | undefined
  readonly title: string | undefined
  readonly path: string
}

export const itemDetail = (
  repo: Repo,
  item: ScannedItem,
  freshness: ReadonlyMap<string, Freshness> | undefined,
) => {
  const link = (edge: { kind: EdgeKind }, other: string): LinkView => {
    const target = repo.index.get(other)
    return { kind: edge.kind, id: target?.id, title: target?.title, path: other }
  }
  const fresh = freshness?.get(item.path)
  return {
    ...itemSummary(item),
    hash: contentHash(item.parsed.source),
    frontmatter: (item.parsed.frontmatter?.data ?? null) as unknown,
    body: item.parsed.source.slice(item.parsed.bodyStart).replace(/^\r?\n/, ''),
    links: repo.index.outgoing(item.path).map((e) => link(e, e.to)),
    backlinks: repo.index.backlinks(item.path).map((e) => link(e, e.from)),
    unresolved: repo.index
      .refs(item.path)
      .filter(({ resolution }) => resolution.status !== 'resolved')
      .map(({ ref, resolution }) => ({
        target: ref.target,
        field: ref.field,
        status: resolution.status,
      })),
    checklist: item.parsed.checklist.map((c) => ({ text: c.text, checked: c.checked })),
    progress: repo.index.progress(item.path) ?? null,
    orphan: repo.index.isOrphan(item.path),
    freshness:
      fresh && fresh.state !== 'not-tracked'
        ? {
            state: fresh.state,
            commits: fresh.commits,
            since: fresh.baseline?.date ?? null,
            atLeast: fresh.atLeast,
          }
        : null,
  }
}

export type NodeStatus = 'backlog' | 'progress' | 'hold' | 'done'

const statusOfCategory = {
  todo: 'backlog',
  active: 'progress',
  blocked: 'hold',
  done: 'done',
} as const

const ratio = (progress: { readonly done: number; readonly total: number } | undefined) =>
  progress === undefined || progress.total <= 0 ? 0 : progress.done / progress.total

const standing = (
  repo: Repo,
  item: ScannedItem,
  categories: ReadonlyMap<string, keyof typeof statusOfCategory>,
): { readonly status: NodeStatus; readonly progress: number } | undefined => {
  const f = fieldsOf(item)
  const progress = repo.index.progress(item.path)
  if (item.type === 'task') {
    const category = typeof f.state === 'string' ? categories.get(f.state) : undefined
    const status = statusOfCategory[category ?? 'todo']
    return { status, progress: status === 'done' ? 1 : ratio(progress) }
  }
  if (item.type === 'project') {
    const own = f.status
    const all = ratio(progress)
    const status: NodeStatus =
      own === 'done' || own === 'archived'
        ? 'done'
        : own === 'paused'
          ? 'hold'
          : all === 1
            ? 'done'
            : 'progress'
    return { status, progress: status === 'done' ? 1 : all }
  }
  if (item.type === 'goal') {
    const own = f.status
    const status: NodeStatus = own === 'achieved' ? 'done' : own === 'dropped' ? 'hold' : 'progress'
    return { status, progress: status === 'done' ? 1 : ratio(progress) }
  }
  return undefined
}

export const graphOf = (
  repo: Repo,
  freshness?: ReadonlyMap<string, Freshness>,
  since?: ReadonlyMap<string, string>,
) => {
  const items = repo.index.items()
  const idOf = new Map(items.map((i) => [i.path, i.id]))
  const categories = new Map(
    repo.workspace.config.states.map((st) => [
      st.name,
      st.category as keyof typeof statusOfCategory,
    ]),
  )
  const nodes = items.flatMap((item) => {
    if (item.id === undefined || item.type === undefined) return []
    const where = standing(repo, item, categories)
    const parent = repo.index
      .outgoing(item.path)
      .find((e) => e.kind === 'belongs_to' && idOf.get(e.to) !== undefined)
    const stale = freshness?.get(item.path)?.state === 'stale'
    return [
      {
        id: item.id,
        type: item.type,
        title: item.title ?? item.id,
        path: item.path,
        ...(where === undefined ? {} : where),
        ...(parent === undefined ? {} : { parent: idOf.get(parent.to) as string }),
        ...(stale ? { stale: true } : {}),
        ...(where === undefined || since?.get(item.id) === undefined
          ? {}
          : { since: since.get(item.id) as string }),
      },
    ]
  })
  const edges = items.flatMap((item) =>
    repo.index.outgoing(item.path).flatMap((edge) => {
      const from = idOf.get(edge.from)
      const to = idOf.get(edge.to)
      return from === undefined || to === undefined ? [] : [{ from, to, kind: edge.kind }]
    }),
  )
  return { nodes, edges }
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

export interface GoalRow {
  readonly id: string
  readonly title: string
  readonly path: string
  readonly status: string
  readonly area: string | undefined
  readonly due: string | undefined
  readonly created: string | undefined
  readonly horizon: string | undefined
  readonly horizonDays: number | undefined
  readonly tags: ReadonlyArray<string>
  readonly progress: { readonly done: number; readonly total: number } | null
  readonly projects: number
}

export interface ProjectRow {
  readonly id: string
  readonly title: string
  readonly path: string
  readonly status: string | undefined
  readonly tags: ReadonlyArray<string>
  readonly progress: { readonly done: number; readonly total: number } | null
  readonly goals: ReadonlyArray<{ readonly id: string; readonly title: string }>
}

const idOrNull = (item: ScannedItem) => (item.id === undefined ? null : item.id)

const projectsOf = (repo: Repo, goalPath: string) =>
  repo.index
    .backlinks(goalPath)
    .filter((e) => e.kind === 'belongs_to')
    .flatMap((e) => {
      const item = repo.index.get(e.from)
      return item?.type === 'project' && item.id !== undefined ? [item] : []
    })

const goalRow = (repo: Repo, item: ScannedItem): GoalRow => {
  const f = fieldsOf(item)
  const horizon =
    typeof f.horizon === 'string' && f.horizon.trim() !== '' ? f.horizon.trim() : undefined
  const parsed = horizon === undefined ? undefined : parseHorizon(horizon)
  return {
    id: item.id as string,
    title: item.title ?? (item.id as string),
    path: item.path,
    status: typeof f.status === 'string' ? f.status : 'active',
    area: typeof f.area === 'string' && f.area !== '' ? f.area : undefined,
    due: typeof f.due === 'string' ? f.due : undefined,
    created: typeof f.created === 'string' ? f.created : undefined,
    horizon,
    horizonDays: parsed === undefined || parsed.forever ? undefined : parsed.days,
    tags: strings(f.tags),
    progress: repo.index.progress(item.path) ?? null,
    projects: projectsOf(repo, item.path).length,
  }
}

const projectRow = (repo: Repo, item: ScannedItem): ProjectRow => {
  const f = fieldsOf(item)
  const goals = strings(f.goals).flatMap((id) => {
    const goal = repo.index.findById(id)[0]
    return goal === undefined ? [] : [{ id, title: goal.title ?? id }]
  })
  return {
    id: item.id as string,
    title: item.title ?? (item.id as string),
    path: item.path,
    status: typeof f.status === 'string' ? f.status : undefined,
    tags: strings(f.tags),
    progress: repo.index.progress(item.path) ?? null,
    goals,
  }
}

export const goalRows = (repo: Repo): GoalRow[] =>
  repo.index
    .items()
    .filter((i) => i.type === 'goal' && idOrNull(i) !== null)
    .map((i) => goalRow(repo, i))
    .sort((a, b) => {
      if ((a.area === undefined) !== (b.area === undefined)) return a.area === undefined ? 1 : -1
      return (a.area ?? '').localeCompare(b.area ?? '') || a.id.localeCompare(b.id)
    })

export const goalDetail = (repo: Repo, item: ScannedItem) => ({
  ...goalRow(repo, item),
  projectRows: projectsOf(repo, item.path)
    .sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''))
    .map((p) => projectRow(repo, p)),
})

export interface BoardCard {
  readonly id: string
  readonly title: string
  readonly path: string
  readonly state: string
  readonly labels: ReadonlyArray<string>
  readonly assignees: ReadonlyArray<string>
  readonly due: string | undefined
  readonly checklist: { readonly done: number; readonly total: number } | null
  readonly waitingOn: ReadonlyArray<{ readonly id: string; readonly title: string }>
}

export interface BoardColumn {
  readonly name: string
  readonly category: string
}

export interface BoardItem {
  readonly id: string
  readonly type: string
  readonly title: string
}

const taskCard = (repo: Repo, item: ScannedItem, doneStates: ReadonlySet<string>): BoardCard => {
  const f = fieldsOf(item)
  const waitingOn = strings(f.depends_on).flatMap((id) => {
    const dep = repo.index.findById(id)[0]
    if (dep === undefined) return []
    const state = fieldsOf(dep).state
    return typeof state === 'string' && doneStates.has(state)
      ? []
      : [{ id, title: dep.title ?? id }]
  })
  return {
    id: item.id as string,
    title: item.title ?? (item.id as string),
    path: item.path,
    state: typeof f.state === 'string' ? f.state : '',
    labels: strings(f.labels),
    assignees: strings(f.assignees),
    due: typeof f.due === 'string' ? f.due : undefined,
    checklist: repo.index.progress(item.path) ?? null,
    waitingOn,
  }
}

export const projectRows = (repo: Repo): ProjectRow[] =>
  repo.index
    .items()
    .filter((i) => i.type === 'project' && i.id !== undefined)
    .sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''))
    .map((i) => projectRow(repo, i))

export const boardOf = (repo: Repo, project: ScannedItem) => {
  const states = repo.workspace.config.states
  const doneStates = new Set(states.filter((s) => s.category === 'done').map((s) => s.name))
  const linked = repo.index.backlinks(project.path).filter((e) => e.kind === 'belongs_to')
  const tasks = linked
    .flatMap((e) => {
      const item = repo.index.get(e.from)
      return item?.type === 'task' && item.id !== undefined ? [item] : []
    })
    .sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''))
    .map((t) => taskCard(repo, t, doneStates))
  const others = repo.index
    .backlinks(project.path)
    .flatMap((e) => {
      const item = repo.index.get(e.from)
      return item !== undefined && item.type !== 'task' && item.id !== undefined
        ? [{ id: item.id, type: item.type ?? '', title: item.title ?? item.id }]
        : []
    })
    .sort((a, b) => a.id.localeCompare(b.id))
  return {
    ...projectRow(repo, project),
    columns: states.map((s): BoardColumn => ({ name: s.name, category: s.category })),
    tasks,
    linked: [...new Map(others.map((o) => [o.id, o])).values()] as BoardItem[],
  }
}

const knowledgeKinds = new Set(['adr', 'doc', 'context', 'runbook'])

export interface KnowledgeRow {
  readonly id: string
  readonly type: string
  readonly title: string
  readonly path: string
  readonly status: string | undefined
  readonly projects: ReadonlyArray<string>
  readonly tags: ReadonlyArray<string>
  readonly freshness: 'fresh' | 'drifting' | 'stale' | 'unknown' | null
  readonly orphan: boolean
  readonly commits: number
  readonly date: string | undefined
  readonly supersedes: ReadonlyArray<string>
  readonly supersededBy: ReadonlyArray<string>
  readonly handle: string | undefined
  readonly aiTokens: number | null
  readonly explains: Readonly<Record<string, number>>
}

const explainsOf = (repo: Repo, path: string): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const edge of repo.index.outgoing(path)) {
    if (edge.kind !== 'explains') continue
    const type = repo.index.get(edge.to)?.type
    if (type !== undefined && type !== 'project') counts[type] = (counts[type] ?? 0) + 1
  }
  return counts
}

export const knowledgeRows = (
  repo: Repo,
  freshness: ReadonlyMap<string, Freshness> | undefined,
): KnowledgeRow[] => {
  const idsOf = (paths: ReadonlyArray<string>) =>
    paths.flatMap((p) => {
      const id = repo.index.get(p)?.id
      return id === undefined ? [] : [id]
    })
  return repo.index
    .items()
    .filter((i) => knowledgeKinds.has(i.type ?? '') && i.id !== undefined)
    .sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''))
    .map((item) => {
      const f = fieldsOf(item)
      const neighbours = [
        ...repo.index.outgoing(item.path).map((e) => e.to),
        ...repo.index.backlinks(item.path).map((e) => e.from),
      ]
      const projects = [
        ...new Set(
          neighbours.flatMap((path) => {
            const other = repo.index.get(path)
            return other?.type === 'project' && other.id !== undefined ? [other.id] : []
          }),
        ),
      ].sort()
      const fresh = freshness?.get(item.path)
      const date = f.reviewed_at ?? f.date ?? f.created
      return {
        id: item.id as string,
        type: item.type as string,
        title: item.title ?? (item.id as string),
        path: item.path,
        status: typeof f.status === 'string' ? f.status : undefined,
        projects,
        tags: strings(f.tags),
        freshness:
          fresh === undefined || fresh.state === 'not-tracked'
            ? null
            : (fresh.state as 'fresh' | 'drifting' | 'stale' | 'unknown'),
        orphan: repo.index.isOrphan(item.path),
        commits: fresh?.commits ?? 0,
        supersedes: idsOf(
          repo.index
            .outgoing(item.path)
            .filter((e) => e.kind === 'supersedes')
            .map((e) => e.to),
        ),
        supersededBy: idsOf(
          repo.index
            .backlinks(item.path)
            .filter((e) => e.kind === 'supersedes')
            .map((e) => e.from),
        ),
        handle:
          [f.owner, f.created_by].find((v): v is string => typeof v === 'string' && v !== '') ??
          undefined,
        aiTokens:
          item.type === 'context' &&
          f.include_in_context === true &&
          f.status !== 'superseded' &&
          f.status !== 'deprecated'
            ? estimateTokens(item.parsed.source.slice(item.parsed.bodyStart))
            : null,
        explains: explainsOf(repo, item.path),
        date:
          typeof date === 'string'
            ? date
            : date instanceof Date
              ? date.toISOString().slice(0, 10)
              : undefined,
      }
    })
}

export const summaryOf = (body: string): string => {
  const paragraphs = body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p !== '' && !p.startsWith('#') && !/^[-*]\s|^\d+\.\s|^```/.test(p))
  const first = paragraphs[0] ?? ''
  return first
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 400)
}

export interface ChainLink {
  readonly id: string
  readonly title: string
  readonly status: string | undefined
}

export const supersessionChain = (repo: Repo, item: ScannedItem): ChainLink[] => {
  const link = (i: ScannedItem): ChainLink => ({
    id: i.id as string,
    title: i.title ?? (i.id as string),
    status: typeof fieldsOf(i).status === 'string' ? (fieldsOf(i).status as string) : undefined,
  })
  const seen = new Set([item.path])
  const walk = (from: ScannedItem, older: boolean): ScannedItem[] => {
    const out: ScannedItem[] = []
    let current = from
    for (;;) {
      const edges = older
        ? repo.index.outgoing(current.path).filter((e) => e.kind === 'supersedes')
        : repo.index.backlinks(current.path).filter((e) => e.kind === 'supersedes')
      const next = edges
        .map((e) => repo.index.get(older ? e.to : e.from))
        .find((i): i is ScannedItem => i !== undefined && i.id !== undefined && !seen.has(i.path))
      if (next === undefined) return out
      seen.add(next.path)
      out.push(next)
      current = next
    }
  }
  return [...walk(item, true).reverse(), item, ...walk(item, false)].map(link)
}
