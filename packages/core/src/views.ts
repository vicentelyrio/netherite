import type { Freshness } from './freshness'
import { contentHash } from './ops/hash'
import type { Repo } from './ops/repo'
import type { ScannedItem } from './scanned-item'
import type { EdgeKind } from './workspace-index'

type Fields = Record<string, unknown>

/** An item's frontmatter as a plain object (empty when it has none or it is not a mapping). */
export const fieldsOf = (item: ScannedItem): Fields => {
  const data = item.parsed.frontmatter?.data
  return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Fields) : {}
}

/** What a list or search result shows about an item. */
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
  /** An ADR status or a task state. */
  readonly status?: string | undefined
  /** A project ID; goals match on the projects that belong to them. */
  readonly project?: string | undefined
  /** A tag or label. */
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

/** Items matching the filters, in ID order, one page of them. */
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

export interface ItemSearchOptions extends ItemFilter {
  readonly types?: ReadonlyArray<string> | undefined
  readonly limit?: number
}

/** Full-text search, best first. Filters apply after the search, so it looks at 10x the limit. */
export const searchItems = (repo: Repo, query: string, options: ItemSearchOptions = {}) => {
  const limit = options.limit ?? 20
  const wide = repo.index.search(query, {
    ...(options.types === undefined ? {} : { types: [...options.types] }),
    limit: limit * 10,
  })
  const results = wide
    .flatMap((hit) => {
      const item = repo.index.get(hit.path)
      return item !== undefined && matchesFilter(item, options)
        ? [{ ...itemSummary(item), score: Math.round(hit.score * 100) / 100 }]
        : []
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

/** One item in full: fields, text, links both ways, progress, orphan flag and freshness. */
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

/** Every item and every typed link between them, for the graph view. */
export const graphOf = (repo: Repo) => {
  const items = repo.index.items()
  const idOf = new Map(items.map((i) => [i.path, i.id]))
  const nodes = items.flatMap((item) =>
    item.id === undefined || item.type === undefined
      ? []
      : [{ id: item.id, type: item.type, title: item.title ?? item.id, path: item.path }],
  )
  const edges = items.flatMap((item) =>
    repo.index.outgoing(item.path).flatMap((edge) => {
      const from = idOf.get(edge.from)
      const to = idOf.get(edge.to)
      return from === undefined || to === undefined ? [] : [{ from, to, kind: edge.kind }]
    }),
  )
  return { nodes, edges }
}
