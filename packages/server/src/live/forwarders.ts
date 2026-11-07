import type { ChangeEvent } from '@netherite/core'
import { Effect } from 'effect'
import { ServerEventType } from '../constants'
import type { ServerState } from '../state'

const ignoredChange = 'ignored'

type Forwarders = {
  readonly [T in ChangeEvent['_tag']]: (
    state: ServerState,
    event: Extract<ChangeEvent, { readonly _tag: T }>,
  ) => Effect.Effect<void>
}

const forwarders: Forwarders = {
  ItemsChanged: (state, event) =>
    Effect.suspend(() => {
      state.invalidate()
      return state.publish({
        type: ServerEventType.Items,
        upserted: [...event.upserted],
        removed: [...event.removed],
        affected: [...event.affected],
        ids: event.affected.flatMap((p) => {
          const id = state.repo.index.get(p)?.id
          return id === undefined ? [] : [id]
        }),
      })
    }),
  GitChanged: (state) =>
    Effect.gen(function* () {
      state.invalidate()
      const status = state.git
        ? yield* state.git.status().pipe(Effect.orElseSucceed(() => undefined))
        : undefined
      yield* state.publish({
        type: ServerEventType.Git,
        ...(status?.oid ? { head: status.oid } : {}),
        ...(status?.branch ? { branch: status.branch } : {}),
        changes: status?.entries.filter((e) => e.kind !== ignoredChange).length ?? 0,
      })
    }),
  ConfigChanged: (state, event) =>
    state.publish({ type: ServerEventType.Config, requiresRestart: event.requiresRestart }),
  ConfigInvalid: (state, event) =>
    state.publish({ type: ServerEventType.ConfigInvalid, message: event.error.message }),
}

export const forward = (state: ServerState, event: ChangeEvent) =>
  (forwarders[event._tag] as (s: ServerState, e: ChangeEvent) => Effect.Effect<void>)(state, event)
