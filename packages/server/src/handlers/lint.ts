import { NetheriteApi } from '@netherite/api'
import { lint, lintText, summarize } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'
import { locate } from './locate'

export const lintReport = (state: ServerState, only?: string) =>
  Effect.gen(function* () {
    const fresh = yield* state.freshness.get
    const diagnostics = lint(state.repo.index, {
      config: state.repo.workspace.config,
      contentRoot: state.repo.contentRoot,
      ...(only ? { only: [only] } : {}),
      ...(fresh ? { freshness: fresh } : {}),
    })
    return { summary: summarize(diagnostics), diagnostics }
  })

export const lintGroup = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'lint', (handlers) =>
    handlers.handle('lint', ({ query }) =>
      Effect.gen(function* () {
        const only = query.id === undefined ? undefined : (yield* locate(state, query.id)).path
        return yield* lintReport(state, only)
      }),
    ),
  )

export const lintTextGroup = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'lintText', (handlers) =>
    handlers.handle('lintText', ({ payload }) =>
      Effect.gen(function* () {
        const item = yield* locate(state, payload.id)
        const freshness = yield* state.freshness.get
        const diagnostics = lintText(state.repo, item.path, payload.text, { freshness })
        return { summary: summarize(diagnostics), diagnostics }
      }),
    ),
  )
