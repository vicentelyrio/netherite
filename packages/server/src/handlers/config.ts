import { NetheriteApi } from '@netherite/api'
import { readWorkspaceConfig, updateWorkspaceConfig } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { ServerEventType } from '../constants'
import { toApiError } from '../errors'
import type { ServerState } from '../state'

export const config = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'config', (handlers) =>
    handlers
      .handle('read', () => readWorkspaceConfig(state.repo).pipe(Effect.mapError(toApiError)))
      .handle('update', ({ payload }) =>
        state.writes.withPermits(1)(
          updateWorkspaceConfig(state.repo, payload).pipe(
            Effect.mapError(toApiError),
            Effect.tap((result) =>
              result.unchanged
                ? Effect.void
                : Effect.gen(function* () {
                    state.invalidate()
                    yield* state.publish({
                      type: ServerEventType.Config,
                      requiresRestart: result.requiresRestart,
                    })
                  }),
            ),
          ),
        ),
      ),
  )
