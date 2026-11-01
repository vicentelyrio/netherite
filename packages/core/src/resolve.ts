import type { ScannedItem } from './scan'

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

const add = <K>(map: Map<K, ScannedItem[]>, key: K | undefined, item: ScannedItem) => {
  if (key === undefined || key === '') return
  const list = map.get(key)
  if (list === undefined) map.set(key, [item])
  else if (!list.includes(item)) list.push(item)
}

const withoutExtension = (path: string) => path.replace(/\.md$/i, '')

/**
 * Builds a resolver over scanned items. A target is looked up by ID, then alias, then file
 * name, then title, and the first step that matches anything decides: one match is a
 * resolution, several are ambiguous, none is broken. IDs and aliases match exactly; file names
 * and titles ignore case, as in Obsidian. A target with `/` matches the end of an item's path.
 */
export const makeResolver = (items: ReadonlyArray<ScannedItem>): Resolver => {
  const byId = new Map<string, ScannedItem[]>()
  const byAlias = new Map<string, ScannedItem[]>()
  const byFile = new Map<string, ScannedItem[]>()
  const byTitle = new Map<string, ScannedItem[]>()

  for (const item of items) {
    add(byId, item.id, item)
    for (const alias of item.aliases) add(byAlias, alias, item)
    add(byFile, item.fileName.toLowerCase(), item)
    add(byTitle, item.title?.trim().toLowerCase(), item)
  }

  const byPath = (target: string) => {
    const wanted = `/${withoutExtension(target).toLowerCase()}`
    return items.filter((item) => `/${withoutExtension(item.path).toLowerCase()}`.endsWith(wanted))
  }

  const headingFound = (item: ScannedItem, heading: string) => {
    const wanted = heading.trim().toLowerCase()
    return item.parsed.headings.some(
      (h) => h.text.toLowerCase() === wanted || h.slug === wanted.replace(/\s+/g, '-'),
    )
  }

  return {
    resolve: (rawTarget, heading) => {
      const target = rawTarget.trim()
      const steps: Array<[ResolvedVia, ReadonlyArray<ScannedItem>]> = [
        ['id', byId.get(target) ?? []],
        ['alias', byAlias.get(target) ?? []],
        [
          'file',
          target.includes('/')
            ? byPath(target)
            : (byFile.get(withoutExtension(target).toLowerCase()) ?? []),
        ],
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
