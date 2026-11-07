import type { ServerEvent } from '@netherite/api'
import type { FreshnessCache, GitError, GitRepository, History, Repo } from '@netherite/core'
import type { Effect, FileSystem, Path, PubSub, Semaphore } from 'effect'

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
  readonly history: Effect.Effect<History | undefined, GitError, FileSystem.FileSystem | Path.Path>
  readonly events: PubSub.PubSub<ServerEvent>
  readonly publish: (event: ServerEvent) => Effect.Effect<void>
  readonly invalidate: () => void
}
