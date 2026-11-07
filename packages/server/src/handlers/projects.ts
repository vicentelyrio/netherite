import { NetheriteApi, NotFound } from '@netherite/api'
import { boardOf, ItemType, projectRows } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'
import { locate } from './locate'

export const projects = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'projects', (handlers) =>
    handlers
      .handle('list', () => Effect.sync(() => ({ projects: projectRows(state.repo) })))
      .handle('board', ({ params }) =>
        Effect.gen(function* () {
          const item = yield* locate(state, params.id)
          if (item.type !== ItemType.Project) {
            return yield* new NotFound({ message: `${params.id} is not a project`, id: params.id })
          }
          return boardOf(state.repo, item)
        }),
      ),
  )
