import { NetheriteApi } from '@netherite/api'
import { timelineOf } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'
import { invalid } from './failures'
import { withHistory } from './history'

export const timeline = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'timeline', (handlers) =>
    handlers.handle('timeline', ({ query }) =>
      withHistory(state, (h) => {
        const date = /^\d{4}-\d{2}-\d{2}$/
        for (const key of ['from', 'to'] as const) {
          const v = query[key]
          if (v !== undefined && !date.test(v))
            return Effect.fail(invalid([key], 'Must be a date like 2026-03-05'))
        }
        return Effect.succeed(
          timelineOf(state.repo, h, {
            ...(query.from ? { from: query.from } : {}),
            ...(query.to ? { to: query.to } : {}),
            now: new Date().toISOString(),
          }),
        )
      }),
    ),
  )
