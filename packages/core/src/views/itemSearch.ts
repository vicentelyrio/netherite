import { settingDefaults } from '@netherite/schema'
import type { Repo } from '../ops/repo'
import { type ItemFilter, itemSummary, matchesFilter } from './itemList'

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
  const limit = options.limit ?? settingDefaults.queries.searchLimit
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
