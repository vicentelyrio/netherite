import type { ScannedItem } from './scanned-item'

/** Which step of the lookup order matched (ADR-00004): id, alias, file name, then title. */
export type ResolvedVia = 'id' | 'alias' | 'file' | 'title'

export type Resolution =
  | {
      readonly status: 'resolved'
      readonly via: ResolvedVia
      readonly item: ScannedItem
      /** Set when the link had a `#heading` part: whether the target has that heading. */
      readonly headingFound?: boolean
    }
  | {
      readonly status: 'ambiguous'
      readonly via: ResolvedVia
      readonly candidates: ReadonlyArray<ScannedItem>
    }
  | { readonly status: 'broken' }

export interface Resolver {
  /** Resolves the target of a `[[wikilink]]`, or an ID written in frontmatter. */
  readonly resolve: (target: string, heading?: string) => Resolution
}

/** A resolver that can be kept up to date as items come and go. */
export interface MutableResolver extends Resolver {
  readonly add: (item: ScannedItem) => void
  readonly remove: (item: ScannedItem) => void
}

const withoutExtension = (path: string) => path.replace(/\.md$/i, '')

/**
 * Every lowercase string that could be written to reach an item: its id, aliases, file name,
 * title, and each trailing part of its path (`docs/Note` and `Note`). Used to find the links
 * whose resolution may change when an item appears, changes or goes away.
 */
export const lookupKeys = (item: ScannedItem): ReadonlySet<string> => {
  const keys = new Set<string>()
  if (item.id) keys.add(item.id.toLowerCase())
  for (const alias of item.aliases) keys.add(alias.trim().toLowerCase())
  if (item.title) keys.add(item.title.trim().toLowerCase())
  const parts = withoutExtension(item.path).toLowerCase().split('/')
  for (let i = 0; i < parts.length; i++) keys.add(parts.slice(i).join('/'))
  keys.delete('')
  return keys
}

/** The lowercase key a link target is looked up under; matches the keys from `lookupKeys`. */
export const targetKey = (target: string) => withoutExtension(target.trim()).toLowerCase()

const addTo = (map: Map<string, ScannedItem[]>, key: string | undefined, item: ScannedItem) => {
  if (key === undefined || key === '') return
  const list = map.get(key)
  if (list === undefined) map.set(key, [item])
  else if (!list.includes(item)) list.push(item)
}

const removeFrom = (
  map: Map<string, ScannedItem[]>,
  key: string | undefined,
  item: ScannedItem,
) => {
  if (key === undefined || key === '') return
  const list = map.get(key)
  if (list === undefined) return
  const rest = list.filter((candidate) => candidate !== item)
  if (rest.length === 0) map.delete(key)
  else map.set(key, rest)
}

/**
 * Creates an empty resolver. A target is looked up by ID, then alias, then file name, then
 * title, and the first step that matches anything decides: one match is a resolution, several
 * are ambiguous, none is broken. IDs and aliases match exactly; file names and titles ignore
 * case, as in Obsidian. A target with `/` matches the end of an item's path.
 */
export const createResolver = (): MutableResolver => {
  const byId = new Map<string, ScannedItem[]>()
  const byAlias = new Map<string, ScannedItem[]>()
  const byFile = new Map<string, ScannedItem[]>()
  const byTitle = new Map<string, ScannedItem[]>()
  /** Items by every trailing part of their path, for targets that contain `/`. */
  const byPath = new Map<string, ScannedItem[]>()

  const apply = (update: typeof addTo, item: ScannedItem) => {
    update(byId, item.id, item)
    for (const alias of item.aliases) update(byAlias, alias, item)
    update(byFile, item.fileName.toLowerCase(), item)
    update(byTitle, item.title?.trim().toLowerCase(), item)
    const parts = withoutExtension(item.path).toLowerCase().split('/')
    for (let i = 0; i < parts.length - 1; i++) update(byPath, parts.slice(i).join('/'), item)
  }

  const headingFound = (item: ScannedItem, heading: string) => {
    const wanted = heading.trim().toLowerCase()
    return item.parsed.headings.some(
      (h) => h.text.toLowerCase() === wanted || h.slug === wanted.replace(/\s+/g, '-'),
    )
  }

  return {
    add: (item) => apply(addTo, item),
    remove: (item) => apply(removeFrom, item),
    resolve: (rawTarget, heading) => {
      const target = rawTarget.trim()
      const key = targetKey(target)
      const steps: Array<[ResolvedVia, ReadonlyArray<ScannedItem>]> = [
        ['id', byId.get(target) ?? []],
        ['alias', byAlias.get(target) ?? []],
        ['file', (target.includes('/') ? byPath.get(key) : byFile.get(key)) ?? []],
        ['title', byTitle.get(target.toLowerCase()) ?? []],
      ]
      for (const [via, matches] of steps) {
        if (matches.length === 0) continue
        const [only] = matches
        if (matches.length > 1 || only === undefined) {
          return { status: 'ambiguous', via, candidates: matches }
        }
        return heading === undefined
          ? { status: 'resolved', via, item: only }
          : { status: 'resolved', via, item: only, headingFound: headingFound(only, heading) }
      }
      return { status: 'broken' }
    },
  }
}

/** Builds a resolver over scanned items. */
export const makeResolver = (items: Iterable<ScannedItem>): Resolver => {
  const resolver = createResolver()
  for (const item of items) resolver.add(item)
  return resolver
}
