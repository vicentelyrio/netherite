import type { LinkInfo } from '@netherite/markdown'
import type { Config } from '@netherite/schema'
import { MultiDirectedGraph } from 'graphology'
import MiniSearch from 'minisearch'
import { createResolver, lookupKeys, type Resolution, targetKey } from './resolve'
import type { ScannedItem } from './scanned-item'

/**
 * Typed edges come from frontmatter (ADR-00003). `reference` is an untyped `[[wikilink]]` in
 * a body. `related` is a task's `related` list.
 */
export type EdgeKind =
  | 'belongs_to'
  | 'implements'
  | 'explains'
  | 'supersedes'
  | 'depends_on'
  | 'related'
  | 'reference'

/** A link written in an item, before it is resolved. */
export interface Ref {
  readonly kind: EdgeKind
  /** An ID or alias from frontmatter, or the target of a `[[wikilink]]`. */
  readonly target: string
  readonly heading?: string
  /** `out`: the edge goes from this item to the target. `in`: from the target to this item. */
  readonly direction: 'out' | 'in'
  /** The frontmatter field, or `body` for a wikilink. */
  readonly field: string
  /** Where the wikilink is in the file. Only for body links. */
  readonly position?: LinkInfo['position']
}

export interface ResolvedRef {
  readonly ref: Ref
  readonly resolution: Resolution
}

export interface Edge {
  readonly kind: EdgeKind
  readonly from: string
  readonly to: string
}

export interface Progress {
  readonly done: number
  readonly total: number
}

export interface SearchHit {
  readonly path: string
  readonly id: string | undefined
  readonly title: string | undefined
  readonly type: string | undefined
  readonly score: number
}

export interface SearchOptions {
  readonly types?: ReadonlyArray<string>
  readonly limit?: number
}

/** What an update touched: the item itself and every item whose links now resolve differently. */
export interface IndexChange {
  readonly changed: ReadonlyArray<string>
}

const knowledgeTypes = new Set(['doc', 'adr', 'context', 'runbook'])

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

const stringOf = (value: unknown): string[] => (typeof value === 'string' ? [value] : [])

type FieldSpec = readonly [field: string, kind: EdgeKind, direction: 'out' | 'in', many: boolean]

const frontmatterFields: Record<string, ReadonlyArray<FieldSpec>> = {
  task: [
    ['project', 'belongs_to', 'out', false],
    ['decisions', 'implements', 'out', true],
    ['depends_on', 'depends_on', 'out', true],
    ['related', 'related', 'out', true],
  ],
  project: [
    ['goals', 'belongs_to', 'out', true],
    ['decisions', 'implements', 'out', true],
  ],
  adr: [
    ['project', 'belongs_to', 'out', false],
    ['supersedes', 'supersedes', 'out', true],
    ['superseded_by', 'supersedes', 'in', false],
  ],
  doc: [
    ['explains', 'explains', 'out', true],
    ['project', 'explains', 'out', false],
  ],
  runbook: [
    ['explains', 'explains', 'out', true],
    ['project', 'explains', 'out', false],
  ],
  context: [
    ['explains', 'explains', 'out', true],
    ['project', 'explains', 'out', false],
  ],
}

/** Every link an item writes: relationship fields in frontmatter, and wikilinks in the body. */
export const extractRefs = (item: ScannedItem): Ref[] => {
  const data = item.parsed.frontmatter?.data
  const fields = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const refs: Ref[] = []
  for (const [field, kind, direction, many] of frontmatterFields[item.type ?? ''] ?? []) {
    const values = many ? stringList(fields[field]) : stringOf(fields[field])
    for (const target of values) refs.push({ kind, target, direction, field })
  }
  for (const link of item.parsed.links) {
    refs.push({
      kind: 'reference',
      target: link.target,
      ...(link.heading === undefined ? {} : { heading: link.heading }),
      direction: 'out',
      field: 'body',
      position: link.position,
    })
  }
  return refs
}

interface Entry {
  item: ScannedItem
  refs: Ref[]
  resolved: ResolvedRef[]
  /** Edges this item asserts. An edge asserted from both ends has two owners. */
  owned: Set<string>
}

const edgeKey = (from: string, kind: EdgeKind, to: string) => `${from}\u0000${kind}\u0000${to}`

const tokenize = (text: string) => {
  const words = text.split(/[\s\p{P}\p{S}]+/u).filter((w) => w.length > 0)
  const ids = text.match(/[A-Za-z]+-\d+/g) ?? []
  return [...words, ...ids]
}

export interface NodeAttributes {
  id?: string
  type?: string
  title?: string
}

export interface EdgeAttributes {
  kind: EdgeKind
}

/** The graph type, named so it can be used in declarations. Nodes are file paths. */
export type IndexGraph = MultiDirectedGraph<NodeAttributes, EdgeAttributes, Record<string, never>>

export interface IndexOptions {
  /** Used to tell which task states count as done. */
  readonly config: Pick<Config, 'states'>
}

/**
 * The in-memory view of a workspace (ADR-00014): items, a graph of typed edges and references,
 * and full-text search. Derived values (backlinks, orphans, progress) are computed from it on
 * demand, never stored. `upsert` and `remove` keep everything consistent after a file changes.
 */
export const createIndex = (options: IndexOptions) => {
  const entries = new Map<string, Entry>()
  const resolver = createResolver()
  const graph: IndexGraph = new MultiDirectedGraph()
  const owners = new Map<string, Set<string>>()
  /** Paths that link to a target, by the lowercase key of the target as written. */
  const referrers = new Map<string, Set<string>>()
  const search = new MiniSearch({
    idField: 'path',
    fields: ['itemId', 'aliases', 'title', 'path', 'text'],
    storeFields: ['itemId', 'title', 'type'],
    tokenize,
    processTerm: (term) => term.toLowerCase(),
    searchOptions: {
      boost: { itemId: 6, aliases: 3, title: 4, path: 1.5 },
      prefix: true,
      fuzzy: 0.15,
    },
  })

  // Building the text index is a quarter of the start-up cost and nothing needs it until the
  // first search, so it is built then (or earlier, by `warmSearch`).
  let searchReady = false
  const ensureSearch = () => {
    if (searchReady) return
    search.addAll([...entries.values()].map((e) => document(e.item)))
    searchReady = true
  }

  const doneStates = new Set(
    options.config.states.filter((s) => s.category === 'done').map((s) => s.name),
  )

  const addReferrers = (entry: Entry) => {
    for (const ref of entry.refs) {
      const key = targetKey(ref.target)
      const set = referrers.get(key) ?? new Set<string>()
      set.add(entry.item.path)
      referrers.set(key, set)
    }
  }
  const removeReferrers = (entry: Entry) => {
    for (const ref of entry.refs) {
      const key = targetKey(ref.target)
      const set = referrers.get(key)
      set?.delete(entry.item.path)
      if (set?.size === 0) referrers.delete(key)
    }
  }

  const unlink = (entry: Entry) => {
    for (const key of entry.owned) {
      const set = owners.get(key)
      set?.delete(entry.item.path)
      if (set !== undefined && set.size === 0) {
        owners.delete(key)
        if (graph.hasEdge(key)) graph.dropEdge(key)
      }
    }
    entry.owned.clear()
    entry.resolved = []
  }

  const link = (entry: Entry) => {
    const self = entry.item.path
    entry.resolved = entry.refs.map((ref) => ({
      ref,
      resolution: resolver.resolve(ref.target, ref.heading),
    }))
    for (const { ref, resolution } of entry.resolved) {
      if (resolution.status !== 'resolved' || resolution.item.path === self) continue
      const from = ref.direction === 'out' ? self : resolution.item.path
      const to = ref.direction === 'out' ? resolution.item.path : self
      const key = edgeKey(from, ref.kind, to)
      if (!graph.hasNode(from) || !graph.hasNode(to)) continue
      if (!graph.hasEdge(key)) graph.addEdgeWithKey(key, from, to, { kind: ref.kind })
      const set = owners.get(key) ?? new Set<string>()
      set.add(self)
      owners.set(key, set)
      entry.owned.add(key)
    }
  }

  const document = (item: ScannedItem) => ({
    path: item.path,
    itemId: item.id ?? '',
    aliases: item.aliases.join(' '),
    title: item.title ?? '',
    type: item.type ?? '',
    text: item.parsed.text,
  })

  const dirtyFor = (...keySets: Array<ReadonlySet<string>>) => {
    const dirty = new Set<string>()
    for (const keys of keySets) {
      for (const key of keys) for (const path of referrers.get(key) ?? []) dirty.add(path)
    }
    return dirty
  }

  const relink = (paths: Iterable<string>) => {
    for (const path of paths) {
      const entry = entries.get(path)
      if (entry === undefined) continue
      unlink(entry)
      link(entry)
    }
  }

  const upsert = (item: ScannedItem): IndexChange => {
    const old = entries.get(item.path)
    const oldKeys = old === undefined ? new Set<string>() : lookupKeys(old.item)
    const newKeys = lookupKeys(item)

    if (old !== undefined) {
      unlink(old)
      removeReferrers(old)
      resolver.remove(old.item)
    }
    const entry: Entry = { item, refs: extractRefs(item), resolved: [], owned: new Set() }
    entries.set(item.path, entry)
    resolver.add(item)
    addReferrers(entry)

    const attributes = {
      ...(item.id === undefined ? {} : { id: item.id }),
      ...(item.type === undefined ? {} : { type: item.type }),
      ...(item.title === undefined ? {} : { title: item.title }),
    }
    if (graph.hasNode(item.path)) graph.replaceNodeAttributes(item.path, attributes)
    else graph.addNode(item.path, attributes)

    if (searchReady) {
      if (old === undefined) search.add(document(item))
      else search.replace(document(item))
    }

    const dirty = dirtyFor(oldKeys, newKeys)
    dirty.add(item.path)
    relink(dirty)
    return { changed: [...dirty].sort() }
  }

  const remove = (path: string): IndexChange => {
    const entry = entries.get(path)
    if (entry === undefined) return { changed: [] }
    const dirty = dirtyFor(lookupKeys(entry.item))
    dirty.delete(path)

    unlink(entry)
    removeReferrers(entry)
    resolver.remove(entry.item)
    entries.delete(path)
    if (searchReady) search.discard(path)
    relink(dirty)
    if (graph.hasNode(path)) graph.dropNode(path)
    return { changed: [path, ...[...dirty].sort()] }
  }

  const outgoing = (path: string): Edge[] => {
    const result: Edge[] = []
    if (graph.hasNode(path)) {
      graph.forEachOutEdge(path, (_key, attrs, from, to) =>
        result.push({ kind: attrs.kind, from, to }),
      )
    }
    return result
  }

  const incoming = (path: string): Edge[] => {
    const result: Edge[] = []
    if (graph.hasNode(path)) {
      graph.forEachInEdge(path, (_key, attrs, from, to) =>
        result.push({ kind: attrs.kind, from, to }),
      )
    }
    return result
  }

  const stateOf = (item: ScannedItem) => {
    const data = item.parsed.frontmatter?.data
    return typeof data === 'object' && data !== null
      ? (data as { state?: unknown }).state
      : undefined
  }

  const taskProgress = (tasks: ReadonlyArray<string>): Progress => {
    let done = 0
    for (const path of tasks) {
      const state = entries.get(path)?.item
      if (state !== undefined && doneStates.has(String(stateOf(state)))) done++
    }
    return { done, total: tasks.length }
  }

  const tasksOf = (projectPath: string) =>
    incoming(projectPath)
      .filter((e) => e.kind === 'belongs_to' && entries.get(e.from)?.item.type === 'task')
      .map((e) => e.from)

  return {
    /** The graph: nodes are file paths; edges are typed. Treat it as read-only. */
    graph,
    resolver,
    upsert,
    remove,

    /** Adds many items at once. Faster than `upsert` in a loop because links resolve once. */
    build: (items: Iterable<ScannedItem>) => {
      for (const item of items) {
        const entry: Entry = { item, refs: extractRefs(item), resolved: [], owned: new Set() }
        entries.set(item.path, entry)
        resolver.add(item)
        addReferrers(entry)
        graph.addNode(item.path, {
          ...(item.id === undefined ? {} : { id: item.id }),
          ...(item.type === undefined ? {} : { type: item.type }),
          ...(item.title === undefined ? {} : { title: item.title }),
        })
      }
      for (const entry of entries.values()) link(entry)
    },

    size: () => entries.size,
    paths: () => [...entries.keys()].sort(),
    get: (path: string) => entries.get(path)?.item,
    items: () => [...entries.values()].map((e) => e.item),
    findById: (id: string) =>
      [...entries.values()].filter((e) => e.item.id === id).map((e) => e.item),

    /** Every link the item writes, with how each one resolved. */
    refs: (path: string): ReadonlyArray<ResolvedRef> => entries.get(path)?.resolved ?? [],
    /** Links that do not resolve to exactly one item, or point at a missing heading. */
    unresolved: () =>
      [...entries.values()].flatMap((entry) =>
        entry.resolved
          .filter(
            ({ resolution }) =>
              resolution.status !== 'resolved' || resolution.headingFound === false,
          )
          .map((resolved) => ({ path: entry.item.path, ...resolved })),
      ),

    outgoing,
    /** Everything that links to the item: its backlinks. Filter by `kind` for a specific relation. */
    incoming,
    backlinks: (path: string) => incoming(path),

    /** Knowledge (docs, ADRs, context, runbooks) that nothing links to. */
    isOrphan: (path: string) => {
      const item = entries.get(path)?.item
      if (item === undefined || !knowledgeTypes.has(item.type ?? '')) return false
      return incoming(path).length === 0
    },
    orphans: () =>
      [...entries.values()]
        .filter(
          ({ item }) => knowledgeTypes.has(item.type ?? '') && graph.inDegree(item.path) === 0,
        )
        .map((e) => e.item.path)
        .sort(),

    /**
     * Task: checked items of its checklist. Project: tasks in a done state. Goal: the same over
     * the tasks of all its projects. `undefined` when there is nothing to count.
     */
    progress: (path: string): Progress | undefined => {
      const item = entries.get(path)?.item
      if (item === undefined) return undefined
      if (item.type === 'task') {
        const list = item.parsed.checklist
        return list.length === 0
          ? undefined
          : { done: list.filter((c) => c.checked).length, total: list.length }
      }
      if (item.type === 'project') {
        const result = taskProgress(tasksOf(path))
        return result.total === 0 ? undefined : result
      }
      if (item.type === 'goal') {
        const projects = incoming(path)
          .filter((e) => e.kind === 'belongs_to' && entries.get(e.from)?.item.type === 'project')
          .map((e) => e.from)
        const result = taskProgress([...new Set(projects.flatMap(tasksOf))])
        return result.total === 0 ? undefined : result
      }
      return undefined
    },

    /** Builds the text index now instead of at the first search. Call it after start-up. */
    warmSearch: ensureSearch,

    /** Full-text search over ID, aliases, title, path and body, with prefix and fuzzy matching. */
    search: (query: string, searchOptions: SearchOptions = {}): SearchHit[] => {
      ensureSearch()
      const types = searchOptions.types
      const results = search.search(query, {
        ...(types === undefined ? {} : { filter: (r) => types.includes(String(r.type)) }),
      })
      return results.slice(0, searchOptions.limit ?? 50).map((r) => ({
        path: String(r.id),
        id: r.itemId ? String(r.itemId) : undefined,
        title: r.title ? String(r.title) : undefined,
        type: r.type ? String(r.type) : undefined,
        score: r.score,
      }))
    },
  }
}

export type WorkspaceIndex = ReturnType<typeof createIndex>
