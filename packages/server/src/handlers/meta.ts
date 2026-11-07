import { NetheriteApi, NotFound } from '@netherite/api'
import { handleFrom, itemJsonSchemas } from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'

export const meta = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'meta', (handlers) =>
    handlers
      .handle('health', () =>
        Effect.gen(function* () {
          const status = state.git
            ? yield* state.git.status().pipe(Effect.orElseSucceed(() => undefined))
            : undefined
          const identity = state.git
            ? yield* state.git.identity.pipe(Effect.orElseSucceed(() => undefined))
            : undefined
          const user = identity ? handleFrom(identity) : undefined
          return {
            name: 'netherite' as const,
            version: state.version,
            root: state.repo.workspace.root,
            items: state.repo.index.size(),
            git: state.git !== undefined,
            ...(status?.branch ? { branch: status.branch } : {}),
            ...(user ? { user } : {}),
          }
        }),
      )
      .handle('schema', ({ params }) => {
        const schemas = itemJsonSchemas(state.repo.schemas) as unknown as Record<string, unknown>
        const schema = schemas[params.type]
        return schema === undefined
          ? Effect.fail(
              new NotFound({ message: `No schema for type "${params.type}"`, id: params.type }),
            )
          : Effect.succeed(schema)
      }),
  )
