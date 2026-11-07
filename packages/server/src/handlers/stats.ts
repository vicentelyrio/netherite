import { NetheriteApi } from '@netherite/api'
import {
  adrActivityByWeek,
  completionsByWeek,
  linkedCommits,
  periodStats,
  progressSeries,
  StateCategoryName,
  undocumentedChurn,
} from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'
import { invalid } from './failures'
import { withHistory } from './history'

export const stats = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'stats', (handlers) =>
    handlers
      .handle('period', ({ query }) =>
        Effect.gen(function* () {
          const period = query.period ?? '30d'
          if (period !== '30d' && period !== 'quarter' && period !== 'year')
            return yield* invalid(['period'], 'Use 30d, quarter or year')
          const fresh = yield* state.freshness.get
          const length = period === '30d' ? 30 : period === 'quarter' ? 90 : 365
          const today = new Date().toISOString().slice(0, 10)
          const first = new Date(Date.parse(`${today}T00:00:00Z`) - (length - 1) * 86_400_000)
            .toISOString()
            .slice(0, 10)
          const undocumented =
            state.git === undefined
              ? []
              : yield* undocumentedChurn(state.git, state.repo.workspace.root, {
                  contentRoot: state.repo.workspace.config.content,
                  from: first,
                  to: today,
                }).pipe(Effect.orElseSucceed(() => []))
          const dayBack = (day: string, n: number) =>
            new Date(Date.parse(`${day}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10)
          const before = { from: dayBack(first, length), to: dayBack(first, 1) }
          const none = { total: 0, linked: 0 }
          const linkage =
            state.git === undefined
              ? undefined
              : {
                  current: yield* linkedCommits(state.git, state.repo.workspace.root, {
                    contentRoot: state.repo.workspace.config.content,
                    from: first,
                    to: today,
                  }).pipe(Effect.orElseSucceed(() => none)),
                  previous: yield* linkedCommits(state.git, state.repo.workspace.root, {
                    contentRoot: state.repo.workspace.config.content,
                    ...before,
                  }).pipe(Effect.orElseSucceed(() => none)),
                }
          return yield* withHistory(state, (h) =>
            Effect.succeed(
              periodStats(state.repo, h, {
                period,
                now: new Date().toISOString(),
                ...(query.area === undefined || query.area === '' ? {} : { area: query.area }),
                ...(fresh === undefined ? {} : { freshness: fresh }),
                undocumented,
                ...(linkage === undefined ? {} : { linkage }),
              }),
            ),
          )
        }),
      )
      .handle('stats', ({ query }) =>
        withHistory(state, (h) => {
          const date = /^\d{4}-\d{2}-\d{2}$/
          for (const key of ['from', 'to'] as const) {
            const v = query[key]
            if (v !== undefined && !date.test(v))
              return Effect.fail(invalid([key], 'Must be a date like 2026-03-05'))
          }
          const range = {
            ...(query.from ? { from: query.from } : {}),
            ...(query.to ? { to: query.to } : {}),
          }
          const done = new Set(
            state.repo.workspace.config.states
              .filter((s) => s.category === StateCategoryName.Done)
              .map((s) => s.name),
          )
          const series = progressSeries(h, done, range)
          return Effect.succeed({
            partial: h.partial,
            completions: completionsByWeek(h, done, range),
            adrs: adrActivityByWeek(h, range),
            progress: {
              projects: Object.fromEntries(series.projects),
              goals: Object.fromEntries(series.goals),
            },
          })
        }),
      ),
  )
