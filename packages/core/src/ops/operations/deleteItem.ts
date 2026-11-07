import { Effect } from 'effect'
import { ConflictError, StillLinked } from '../../errors'
import { contentHash } from '../hash'
import { applyChanges, readText } from '../io'
import type { Repo } from '../repo'
import { locate } from './mutate'
import type { OpEnv, OpError, OpOptions } from './operations.types'

export const deleteItem = (
  repo: Repo,
  id: string,
  options: OpOptions & { readonly force?: boolean } = {},
): Effect.Effect<{ readonly id: string; readonly path: string }, OpError, OpEnv> =>
  Effect.gen(function* () {
    const item = yield* locate(repo, id)
    const referrers = repo.index
      .incoming(item.path)
      .filter((edge) => edge.from !== item.path)
      .map((edge) => ({ path: edge.from, kind: edge.kind }))
    if (referrers.length > 0 && options.force !== true) {
      return yield* new StillLinked({ id, referrers })
    }
    const source = yield* readText(repo, item.path)
    if (options.baseHash !== undefined && contentHash(source) !== options.baseHash) {
      return yield* new ConflictError({
        path: item.path,
        expected: options.baseHash,
        actual: contentHash(source),
      })
    }
    yield* applyChanges(repo, [{ path: item.path, content: null, before: source }])
    return { id, path: item.path }
  })
