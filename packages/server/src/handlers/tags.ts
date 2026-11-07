import { NetheriteApi } from '@netherite/api'
import { renameTag, tagMap, tagUsage } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { toApiError } from '../errors'
import type { ServerState } from '../state'
import { notifyChanged } from './write'

export const tags = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'tags', (handlers) =>
    handlers
      .handle('list', () => Effect.sync(() => ({ tags: tagUsage(state.repo) })))
      .handle('map', () => Effect.sync(() => tagMap(state.repo)))
      .handle('rename', ({ payload }) =>
        state.writes.withPermits(1)(
          renameTag(state.repo, payload).pipe(
            Effect.mapError(toApiError),
            Effect.tap((r) => notifyChanged(state, r.changed, [])),
          ),
        ),
      ),
  )
