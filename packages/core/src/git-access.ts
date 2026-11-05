import { detectGit, type GitRepository, handleFrom } from '@netherite/git'
import { Effect } from 'effect'
import type { Workspace } from './workspace'

export type { GitError, GitRepository, GitStatus, StatusEntry } from '@netherite/git'

export const workspaceGit = (workspace: Pick<Workspace, 'root'>) =>
  Effect.map(detectGit(workspace.root), (found) => (found.available ? found.git : undefined))

export const gitHandle = (git: GitRepository | undefined) =>
  git === undefined
    ? Effect.succeed<string | undefined>(undefined)
    : Effect.map(
        git.identity.pipe(
          Effect.orElseSucceed(() => ({ name: undefined, email: undefined, github: undefined })),
        ),
        handleFrom,
      )
