import {
  type FreshnessCache,
  freshnessCache,
  type GitRepository,
  type History,
  type Repo,
  readHistory,
} from '@netherite/core'
import { Effect, Semaphore } from 'effect'

export interface ServerOptions {
  /** The repository's git, for freshness, history and stats. Leave out when there is none. */
  readonly git?: GitRepository | undefined
  /** A `@handle` recorded as `created_by` on items created through the API. */
  readonly createdBy?: string | undefined
  readonly version?: string
}

/** Everything the handlers share. One per repository. */
export interface ServerState {
  readonly repo: Repo
  readonly git: GitRepository | undefined
  readonly createdBy: string | undefined
  readonly version: string
  readonly freshness: FreshnessCache
  /** Writes run one at a time, so two requests cannot interleave their read-check-rename steps. */
  readonly writes: Semaphore.Semaphore
  /** The git history of the content folder, read once per commit. */
  readonly history: Effect.Effect<
    History | undefined,
    import('@netherite/core').GitError,
    import('effect').FileSystem.FileSystem | import('effect').Path.Path
  >
  /** Call when files changed outside the server, so cached data is recomputed. */
  readonly invalidate: () => void
}

export const makeState = (repo: Repo, options: ServerOptions = {}) =>
  Effect.gen(function* () {
    const freshness = freshnessCache(repo, options.git)
    const writes = yield* Semaphore.make(1)
    let cached: { head: string | undefined; history: History } | undefined

    const history: ServerState['history'] = Effect.gen(function* () {
      const git = options.git
      if (git === undefined) return undefined
      const head = yield* git.head
      if (cached !== undefined && cached.head === head) return cached.history
      const read = yield* readHistory(git, repo.workspace.root, {
        contentRoot: repo.contentRoot,
      })
      cached = { head, history: read }
      return read
    })

    return {
      repo,
      git: options.git,
      createdBy: options.createdBy,
      version: options.version ?? '0.0.0',
      freshness,
      writes,
      history,
      invalidate: () => {
        freshness.invalidate()
        cached = undefined
      },
    } satisfies ServerState
  })
