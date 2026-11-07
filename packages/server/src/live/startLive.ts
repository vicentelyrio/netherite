import { lint as lintIndex, settingDefaults, summarize, watchRepo } from '@netherite/core'
import { Effect, PubSub, Stream } from 'effect'
import { lintTriggers, ServerEventType } from '../constants'
import type { ServerState } from '../state'
import { forward } from './forwarders'
import type { LiveOptions } from './live.types'

const summaryKey = (s: { error: number; warning: number; info: number }) =>
  `${s.error}/${s.warning}/${s.info}`

export const startLive = (state: ServerState, options: LiveOptions = {}) =>
  Effect.gen(function* () {
    const { repo } = state

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
      Stream.filter((e) => lintTriggers.has(e.type)),
      Stream.debounce(options.lintDebounceMs ?? settingDefaults.server.lintDebounceMs),
      Stream.runForEach(() =>
        Effect.gen(function* () {
          const summary = yield* lintNow
          const key = summaryKey(summary)
          if (key === last) return
          last = key
          yield* state.publish({ type: ServerEventType.Lint, ...summary })
        }),
      ),
      Effect.forkScoped,
    )

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
