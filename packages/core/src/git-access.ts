import { detectGit, type GitRepository, handleFrom } from '@netherite/git'
import { Effect } from 'effect'
import type { Workspace } from './workspace'

export type { GitRepository } from '@netherite/git'

/**
 * The git repository around a workspace, or `undefined` when there is none or git is not
 * installed. Git-derived features simply turn off in that case.
 */
export const workspaceGit = (workspace: Pick<Workspace, 'root'>) =>
  Effect.map(detectGit(workspace.root), (found) => (found.available ? found.git : undefined))

/** The `@handle` of whoever git says is working here, or `undefined` if it is not set. */
export const gitHandle = (git: GitRepository | undefined) =>
  git === undefined
    ? Effect.succeed<string | undefined>(undefined)
    : Effect.map(
        git.identity.pipe(
          Effect.orElseSucceed(() => ({ name: undefined, email: undefined, github: undefined })),
        ),
        handleFrom,
      )
