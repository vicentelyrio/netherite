import { NetheriteApi } from '@netherite/api'
import { computeFreshness, graphAsOf, graphOf, lifecycles } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'
import { invalid } from './failures'
import { withHistory } from './history'

export const graph = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'graph', (handlers) =>
    handlers.handle('graph', ({ query }) =>
      Effect.gen(function* () {
        if (query.asOf !== undefined) {
          const asOf = query.asOf
          if (
            !/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/u.test(asOf) ||
            Number.isNaN(Date.parse(asOf))
          )
            return yield* invalid(['asOf'], 'Use a date such as 2026-03-01')
          const freshness =
            state.git === undefined
              ? undefined
              : yield* computeFreshness({
                  index: state.repo.index,
                  git: state.git,
                  thresholds: state.repo.workspace.config.freshness,
                  root: state.repo.workspace.root,
                  asOf,
                }).pipe(Effect.orElseSucceed(() => undefined))
          return yield* withHistory(state, (h) =>
            Effect.succeed(
              graphAsOf(state.repo, h, { asOf, now: new Date().toISOString(), freshness }),
            ),
          )
        }
        const fresh = yield* state.freshness.get
        const past = state.git === undefined ? undefined : yield* state.history.pipe(Effect.option)
        const since = new Map<string, string>()
        if (past !== undefined && past._tag === 'Some' && past.value !== undefined) {
          const found = lifecycles(past.value, { states: state.repo.workspace.config.states })
          for (const [id, life] of found) {
            const at = life.finished ?? life.spans.at(-1)?.from ?? life.started ?? life.created
            if (at !== undefined) since.set(id, at)
          }
        }
        return graphOf(state.repo, fresh, since)
      }),
    ),
  )
