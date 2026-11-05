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
  readonly git?: GitRepository | undefined
  readonly createdBy?: string | undefined
  readonly version?: string
  readonly token?: string
  readonly origins?: ReadonlyArray<string>
}

export interface ServerState {
  readonly repo: Repo
  readonly git: GitRepository | undefined
  readonly createdBy: string | undefined
  readonly version: string
  readonly token: string
  readonly origins: ReadonlyArray<string>
  readonly freshness: FreshnessCache
  readonly writes: Semaphore.Semaphore
  readonly history: Effect.Effect<
    History | undefined,
    import('@netherite/core').GitError,
    import('effect').FileSystem.FileSystem | import('effect').Path.Path
  >
  readonly events: PubSub.PubSub<ServerEvent>
  readonly publish: (event: ServerEvent) => Effect.Effect<void>
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
