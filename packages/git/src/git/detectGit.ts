import { Effect } from 'effect'
import type { GitAvailability, GitOptions } from './git.types'
import { openGit } from './openGit'

export const detectGit = (dir: string, options: GitOptions = {}) =>
  openGit(dir, options).pipe(
    Effect.map((git): GitAvailability => ({ available: true, git })),
    Effect.catchTags({
      GitNotInstalled: (error) =>
        Effect.succeed<GitAvailability>({
          available: false,
          reason: 'git-not-installed',
          message: error.message,
        }),
      NotARepository: (error) =>
        Effect.succeed<GitAvailability>({
          available: false,
          reason: 'not-a-repository',
          message: error.message,
        }),
    }),
  )
