import type { WriteResult } from '@netherite/api'
import type { OpResult } from '@netherite/core'
import { Effect } from 'effect'
import { ServerEventType } from '../constants'
import { toApiError } from '../errors'
import type { ServerState } from '../state'

const written = (r: OpResult): WriteResult => ({
  id: r.id,
  path: r.path,
  hash: r.hash,
  changed: r.changed,
  unchanged: r.unchanged,
})

export const notifyChanged = (
  state: ServerState,
  upserted: ReadonlyArray<string>,
  removed: ReadonlyArray<string>,
) =>
  Effect.gen(function* () {
    state.invalidate()
    const affected = [...new Set([...upserted, ...removed])].sort()
    yield* state.publish({
      type: ServerEventType.Items,
      upserted: [...upserted],
      removed: [...removed],
      affected,
      ids: affected.flatMap((p) => {
        const id = state.repo.index.get(p)?.id
        return id === undefined ? [] : [id]
      }),
    })
  })

export const write =
  (state: ServerState) =>
  <E, R>(effect: Effect.Effect<OpResult, E, R>) =>
    state.writes.withPermits(1)(
      effect.pipe(
        Effect.mapError(toApiError),
        Effect.tap((r) => notifyChanged(state, r.changed, [])),
        Effect.map(written),
      ),
    )
