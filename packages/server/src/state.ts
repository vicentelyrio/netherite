import type { ServerEvent } from '@netherite/api'
import {
  type FreshnessCache,
  freshnessCache,
  type GitRepository,
  type History,
  type Repo,
  readHistory,
  withWorkingTree,
} from '@netherite/core'
import { Effect, PubSub, Semaphore } from 'effect'
import { newToken } from './security'

export interface ServerOptions {
  /** The repository's git, for freshness, history and stats. Leave out when there is none. */
  readonly git?: GitRepository | undefined
  /** A `@handle` recorded as `created_by` on items created through the API. */
  readonly createdBy?: string | undefined
  readonly version?: string
  /** The session token writes must carry. Default: a fresh random one. */
  readonly token?: string
  /** Extra origins allowed to call the API, such as `http://localhost:5173` while developing the app. */
  readonly origins?: ReadonlyArray<string>
}

/** Everything the handlers share. One per repository. */
export interface ServerState {
  readonly repo: Repo
  readonly git: GitRepository | undefined
  readonly createdBy: string | undefined
  readonly version: string
  /** The secret for this session: writes without it get 401. */
  readonly token: string
  readonly origins: ReadonlyArray<string>
  readonly freshness: FreshnessCache
  /** Writes run one at a time, so two requests cannot interleave their read-check-rename steps. */
  readonly writes: Semaphore.Semaphore
  /** The git history of the content folder, read once per commit. */
  readonly history: Effect.Effect<
    History | undefined,
    import('@netherite/core').GitError,
    import('effect').FileSystem.FileSystem | import('effect').Path.Path
  >
  /** Events for connected clients (`GET /api/events`). Subscribers see events published after they join. */
  readonly events: PubSub.PubSub<ServerEvent>
  /** Sends an event to every connected client. */
  readonly publish: (event: ServerEvent) => Effect.Effect<void>
  /** Call when files changed outside the server, so cached data is recomputed. */
  readonly invalidate: () => void
}

export const makeState = (repo: Repo, options: ServerOptions = {}) =>
  Effect.gen(function* () {
    const freshness = freshnessCache(repo, options.git)
    const writes = yield* Semaphore.make(1)
    const events = yield* PubSub.unbounded<ServerEvent>()
    let cached: { head: string | undefined; history: History } | undefined

    const history: ServerState['history'] = Effect.gen(function* () {
      const git = options.git
      if (git === undefined) return undefined
      const head = yield* git.head
      // What was committed is read once per commit; what is only in the files is laid over it each time.
      if (cached !== undefined && cached.head === head) {
        return withWorkingTree(cached.history, repo.index, new Date().toISOString())
      }
      const read = yield* readHistory(git, repo.workspace.root, {
        contentRoot: repo.contentRoot,
      })
      cached = { head, history: read }
      return withWorkingTree(read, repo.index, new Date().toISOString())
    })

    return {
      repo,
      git: options.git,
      createdBy: options.createdBy,
      version: options.version ?? '0.0.0',
      token: options.token ?? newToken(),
      origins: options.origins ?? [],
      freshness,
      writes,
      events,
      publish: (event) => PubSub.publish(events, event).pipe(Effect.asVoid),
      history,
      invalidate: () => {
        freshness.invalidate()
        cached = undefined
      },
    } satisfies ServerState
  })
