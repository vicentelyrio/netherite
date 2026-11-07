import type { Effect } from 'effect'
import type { GitError } from '../errors'
import type { GitIdentity } from '../identity'
import type { CommitInfo, CommitPatch, GitStatus } from '../parse'

export interface GitOptions {
  readonly timeoutMs?: number
  readonly cacheSize?: number
  readonly executable?: string
}

export interface LogOptions {
  readonly paths?: ReadonlyArray<string>
  readonly since?: string
  readonly after?: string
  readonly limit?: number
  readonly files?: 'none' | 'names' | 'numstat'
}

export interface PatchLogOptions {
  readonly paths: ReadonlyArray<string>
  readonly after?: string
  readonly limit?: number
  readonly context?: number
}

export interface StatusOptions {
  readonly untracked?: 'all' | 'normal' | 'no'
}

export interface GitRepository {
  readonly root: string
  readonly gitDir: string
  readonly shallow: boolean
  readonly head: Effect.Effect<string | undefined, GitError>
  readonly status: (options?: StatusOptions) => Effect.Effect<GitStatus, GitError>
  readonly log: (options?: LogOptions) => Effect.Effect<ReadonlyArray<CommitInfo>, GitError>
  readonly patchLog: (
    options: PatchLogOptions,
  ) => Effect.Effect<ReadonlyArray<CommitPatch>, GitError>
  readonly readCommits: (
    hashes: ReadonlyArray<string>,
    options?: { readonly files?: 'none' | 'names' | 'numstat' },
  ) => Effect.Effect<ReadonlyArray<CommitInfo>, GitError>
  readonly firstCommit: (path: string) => Effect.Effect<CommitInfo | undefined, GitError>
  readonly fileAt: (path: string, rev?: string) => Effect.Effect<string | undefined, GitError>
  readonly identity: Effect.Effect<GitIdentity, GitError>
  readonly shallowBoundary: Effect.Effect<ReadonlyArray<string>>
  readonly invalidate: () => void
}

export type GitAvailability =
  | { readonly available: true; readonly git: GitRepository }
  | {
      readonly available: false
      readonly reason: 'git-not-installed' | 'not-a-repository'
      readonly message: string
    }

export interface Output {
  readonly stdout: string
  readonly stderr: string
  readonly code: number
}
