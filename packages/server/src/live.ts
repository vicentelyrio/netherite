import {
  type ChangeEvent,
  lint as lintIndex,
  summarize,
  type WatchOptions,
  watchRepo,
} from '@netherite/core'
import { Effect, PubSub, Stream } from 'effect'
import type { ServerState } from './state'

export interface LiveOptions extends Pick<WatchOptions, 'backend' | 'debounceMs'> {
  /** Do not watch the disk. Writes through the API still reach clients. */
  readonly watch?: boolean
  /** How long to wait after a burst of changes before recomputing lint. Default 50 ms. */
  readonly lintDebounceMs?: number
}

const summaryKey = (s: { error: number; warning: number; info: number }) =>
  `${s.error}/${s.warning}/${s.info}`

/**
 * Turns changes into events for connected clients (ADR-00010): the watcher's item, git and
 * config changes, and a `lint` event whenever the lint result differs from the last one sent.
 * Runs until the scope closes. Changes made through the API are published by the handlers, so
 * lint follows them too.
 */
export const startLive = (state: ServerState, options: LiveOptions = {}) =>
  Effect.gen(function* () {
    const { repo } = state

    // --- lint: recompute after anything that can change it, and say so only when it did -----
    const lintNow = Effect.gen(function* () {
      const freshness = yield* state.freshness.get
      return summarize(
        lintIndex(repo.index, {
          config: repo.workspace.config,
          contentRoot: repo.contentRoot,
          ...(freshness ? { freshness } : {}),
        }),
      )
    })
    let last = summaryKey(yield* lintNow)

    const subscription = yield* PubSub.subscribe(state.events)
    yield* Stream.fromSubscription(subscription).pipe(
      Stream.filter((e) => e.type === 'items' || e.type === 'git' || e.type === 'config'),
      Stream.debounce(options.lintDebounceMs ?? 50),
      Stream.runForEach(() =>
        Effect.gen(function* () {
          const summary = yield* lintNow
          const key = summaryKey(summary)
          if (key === last) return
          last = key
          yield* state.publish({ type: 'lint', ...summary })
        }),
      ),
      Effect.forkScoped,
    )

    // --- the disk ----------------------------------------------------------------------------
    if (options.watch === false) return undefined

    const watcher = yield* watchRepo(repo, {
      ...(state.git ? { gitDir: state.git.gitDir } : {}),
      ...(options.backend ? { backend: options.backend } : {}),
      ...(options.debounceMs === undefined ? {} : { debounceMs: options.debounceMs }),
    })
    yield* watcher.events.pipe(
      Stream.runForEach((event) => forward(state, event)),
      Effect.forkScoped,
    )
    return watcher
  })

const forward = (state: ServerState, event: ChangeEvent) =>
  Effect.gen(function* () {
    switch (event._tag) {
      case 'ItemsChanged': {
        // The index is already up to date; cached freshness and history are not.
        state.invalidate()
        yield* state.publish({
          type: 'items',
          upserted: [...event.upserted],
          removed: [...event.removed],
          affected: [...event.affected],
          ids: event.affected.flatMap((p) => {
            const id = state.repo.index.get(p)?.id
            return id === undefined ? [] : [id]
          }),
        })
        return
      }
      case 'GitChanged': {
        state.invalidate()
        const status = state.git
          ? yield* state.git.status().pipe(Effect.orElseSucceed(() => undefined))
          : undefined
        yield* state.publish({
          type: 'git',
          ...(status?.oid ? { head: status.oid } : {}),
          ...(status?.branch ? { branch: status.branch } : {}),
          changes: status?.entries.filter((e) => e.kind !== 'ignored').length ?? 0,
        })
        return
      }
      case 'ConfigChanged':
        yield* state.publish({ type: 'config', requiresRestart: event.requiresRestart })
        return
      case 'ConfigInvalid':
        yield* state.publish({ type: 'config-invalid', message: event.error.message })
        return
    }
  })
