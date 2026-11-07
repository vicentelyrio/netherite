import { NetheriteApi, NotFound } from '@netherite/api'
import { decisionLog, fieldsOf, type History } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'
import { gitFailure, noGit } from './failures'

export const withHistory = <A, E>(
  state: ServerState,
  use: (history: History) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    if (state.git === undefined) return yield* noGit()
    const history = yield* state.history.pipe(Effect.mapError(gitFailure))
    if (history === undefined) return yield* noGit()
    return yield* use(history)
  })

export const history = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'history', (handlers) =>
    handlers
      .handle('decisions', ({ query }) =>
        withHistory(state, (h) => {
          const inProject = (id: string) => {
            if (query.project === undefined) return true
            const item = state.repo.index.findById(id)[0]
            return item !== undefined && fieldsOf(item).project === query.project
          }
          return Effect.succeed({
            partial: h.partial,
            transitions: decisionLog(h).filter((t) => inProject(t.id)),
          })
        }),
      )
      .handle('item', ({ params }) =>
        withHistory(state, (h) => {
          const item = h.items.get(params.id)
          if (item === undefined)
            return Effect.fail(
              new NotFound({ message: `No history for ${params.id}`, id: params.id }),
            )
          return Effect.succeed({
            id: item.id,
            paths: item.paths,
            commits: item.commits,
            ...(item.created ? { created: item.created } : {}),
            ...(item.deletedAt ? { deletedAt: item.deletedAt } : {}),
            transitions: item.transitions,
            authors: item.authors,
          })
        }),
      ),
  )
