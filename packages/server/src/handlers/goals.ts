import { NetheriteApi, NotFound } from '@netherite/api'
import { goalDetail, goalRows, ItemType, renameArea } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { toApiError } from '../errors'
import type { ServerState } from '../state'
import { locate } from './locate'
import { notifyChanged } from './write'

export const goals = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'goals', (handlers) =>
    handlers
      .handle('list', () => Effect.sync(() => ({ goals: goalRows(state.repo) })))
      .handle('get', ({ params }) =>
        Effect.gen(function* () {
          const item = yield* locate(state, params.id)
          if (item.type !== ItemType.Goal) {
            return yield* new NotFound({ message: `${params.id} is not a goal`, id: params.id })
          }
          return goalDetail(state.repo, item)
        }),
      )
      .handle('renameArea', ({ payload }) =>
        state.writes.withPermits(1)(
          renameArea(state.repo, payload).pipe(
            Effect.mapError(toApiError),
            Effect.tap((r) => notifyChanged(state, r.changed, [])),
          ),
        ),
      ),
  )
