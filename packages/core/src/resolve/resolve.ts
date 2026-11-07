import type { ScannedItem } from '../scanned-item'

export type ResolvedVia = 'id' | 'alias' | 'file' | 'title'

export type Resolution =
  | {
      readonly status: 'resolved'
      readonly via: ResolvedVia
      readonly item: ScannedItem
      readonly headingFound?: boolean
    }
  | {
      readonly status: 'ambiguous'
      readonly via: ResolvedVia
      readonly candidates: ReadonlyArray<ScannedItem>
    }
  | { readonly status: 'broken' }

export interface Resolver {
  readonly resolve: (target: string, heading?: string) => Resolution
}

export interface MutableResolver extends Resolver {
  readonly add: (item: ScannedItem) => void
  readonly remove: (item: ScannedItem) => void
}

const withoutExtension = (path: string) => path.replace(/\.md$/i, '')

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

export const createResolver = (): MutableResolver => {
  const byId = new Map<string, ScannedItem[]>()
  const byAlias = new Map<string, ScannedItem[]>()
  const byFile = new Map<string, ScannedItem[]>()
  const byTitle = new Map<string, ScannedItem[]>()
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

export const makeResolver = (items: Iterable<ScannedItem>): Resolver => {
  const resolver = createResolver()
  for (const item of items) resolver.add(item)
  return resolver
}
