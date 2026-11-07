import {
  type Config,
  ItemType,
  RelationKind,
  StateCategoryName,
  settingDefaults,
} from '@netherite/schema'
import { MultiDirectedGraph } from 'graphology'
import MiniSearch from 'minisearch'
import { createResolver, lookupKeys, targetKey } from '../resolve'
import type { ScannedItem } from '../scanned-item'
import { extractRefs } from './extractRefs'
import { canBeOrphan } from './orphans'
import type {
  Edge,
  EdgeKind,
  Entry,
  IndexChange,
  IndexGraph,
  IndexOptions,
  Progress,
  ResolvedRef,
  SearchHit,
  SearchOptions,
} from './workspace-index.types'

const edgeKey = (from: string, kind: EdgeKind, to: string) => `${from}\u0000${kind}\u0000${to}`

const tokenize = (text: string) => {
  const words = text.split(/[\s\p{P}\p{S}]+/u).filter((w) => w.length > 0)
  const ids = text.match(/[A-Za-z]+-\d+/g) ?? []
  return [...words, ...ids]
}

export const createIndex = (options: IndexOptions) => {
  const entries = new Map<string, Entry>()
  const resolver = createResolver()
  const graph: IndexGraph = new MultiDirectedGraph()
  const owners = new Map<string, Set<string>>()
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

  let searchReady = false
  const ensureSearch = () => {
    if (searchReady) return
    search.addAll([...entries.values()].map((e) => document(e.item)))
    searchReady = true
  }

  let doneStates = new Set<string>()
  const setConfig = (config: Pick<Config, 'states'>) => {
    doneStates = new Set(
      config.states.filter((s) => s.category === StateCategoryName.Done).map((s) => s.name),
    )
  }
  setConfig(options.config)

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
      .filter(
        (e) =>
          e.kind === RelationKind.BelongsTo && entries.get(e.from)?.item.type === ItemType.Task,
      )
      .map((e) => e.from)

  return {
    graph,
    resolver,
    upsert,
    remove,

    setConfig,

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

    refs: (path: string): ReadonlyArray<ResolvedRef> => entries.get(path)?.resolved ?? [],
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
    incoming,
    backlinks: (path: string) => incoming(path),

    isOrphan: (path: string) => {
      const item = entries.get(path)?.item
      return item !== undefined && canBeOrphan(item) && incoming(path).length === 0
    },
    orphans: () =>
      [...entries.values()]
        .filter(({ item }) => canBeOrphan(item) && graph.inDegree(item.path) === 0)
        .map((e) => e.item.path)
        .sort(),

    progress: (path: string): Progress | undefined => {
      const item = entries.get(path)?.item
      if (item === undefined) return undefined
      if (item.type === ItemType.Task) {
        const list = item.parsed.checklist
        return list.length === 0
          ? undefined
          : { done: list.filter((c) => c.checked).length, total: list.length }
      }
      if (item.type === ItemType.Project) {
        const result = taskProgress(tasksOf(path))
        return result.total === 0 ? undefined : result
      }
      if (item.type === ItemType.Goal) {
        const projects = incoming(path)
          .filter(
            (e) =>
              e.kind === RelationKind.BelongsTo &&
              entries.get(e.from)?.item.type === ItemType.Project,
          )
          .map((e) => e.from)
        const result = taskProgress([...new Set(projects.flatMap(tasksOf))])
        return result.total === 0 ? undefined : result
      }
      return undefined
    },

    warmSearch: ensureSearch,

    search: (query: string, searchOptions: SearchOptions = {}): SearchHit[] => {
      ensureSearch()
      const types = searchOptions.types
      const results = search.search(query, {
        ...(types === undefined ? {} : { filter: (r) => types.includes(String(r.type)) }),
      })
      return results
        .slice(0, searchOptions.limit ?? settingDefaults.queries.listLimit)
        .map((r) => ({
          path: String(r.id),
          id: r.itemId ? String(r.itemId) : undefined,
          title: r.title ? String(r.title) : undefined,
          type: r.type ? String(r.type) : undefined,
          score: r.score,
        }))
    },
  }
}
