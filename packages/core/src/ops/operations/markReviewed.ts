import { Clock, Effect } from 'effect'
import type { Repo } from '../repo'
import { invalid, isoDate, locate } from './mutate'
import type { Op, OpOptions } from './operations.types'
import { updateFields } from './updateItem'

export const markReviewed = (
  repo: Repo,
  id: string,
  options: OpOptions & { readonly date?: string } = {},
): Op =>
  Effect.gen(function* () {
    const item = yield* locate(repo, id)
    if (!['doc', 'runbook', 'context'].includes(item.type ?? '')) {
      return yield* invalid(
        ['type'],
        `A ${item.type ?? 'item'} has no review date; only docs, runbooks and context do`,
      )
    }
    const now = yield* Clock.currentTimeMillis
    return yield* updateFields(
      repo,
      id,
      { set: { reviewed_at: options.date ?? isoDate(now) } },
      options,
    )
  })
