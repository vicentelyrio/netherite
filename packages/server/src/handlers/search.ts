import { NetheriteApi } from '@netherite/api'
import { itemTypes, searchItems, settingDefaults } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'
import { invalid } from './failures'

export const search = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'search', (handlers) =>
    handlers.handle('search', ({ query }) =>
      Effect.gen(function* () {
        const limit = query.limit ?? settingDefaults.queries.searchLimit
        if (!Number.isInteger(limit) || limit < 1 || limit > 100)
          return yield* invalid(['limit'], 'Must be a whole number from 1 to 100')
        const types = query.types
          ?.split(',')
          .map((t) => t.trim())
          .filter((t) => t !== '')
        const unknown = types?.find((t) => !(itemTypes as ReadonlyArray<string>).includes(t))
        if (unknown !== undefined) return yield* invalid(['types'], `Unknown type "${unknown}"`)
        const found = searchItems(state.repo, query.q, { ...query, types, limit })
        const fresh = yield* state.freshness.get
        return {
          total: found.total,
          results: found.results.flatMap((r) => {
            if (r.id === undefined || r.type === undefined) return []
            const f = fresh?.get(r.path)
            const stale = f?.state === 'stale' || f?.state === 'drifting'
            return [
              { ...r, id: r.id, type: r.type, title: r.title ?? r.id, ...(stale ? { stale } : {}) },
            ]
          }),
        }
      }),
    ),
  )
