import type { GitRepository } from '@netherite/git'
import { Effect, FileSystem, Path } from 'effect'

/**
 * Translates between workspace paths (relative to the folder that holds `.netherite/`) and the
 * paths git reports (relative to the top of the repository). They differ only when the
 * workspace is a subfolder of a larger repository.
 */
export interface PathMap {
  /** Workspace path to git path. */
  readonly toGit: (workspacePath: string) => string
  /** Git path to workspace path, or `undefined` for a file outside the workspace. */
  readonly fromGit: (gitPath: string) => string | undefined
}

export const pathMap = (git: Pick<GitRepository, 'root'>, workspaceRoot: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const real = yield* fs.realPath(workspaceRoot).pipe(Effect.orElseSucceed(() => workspaceRoot))
    const prefix = path.relative(git.root, real).split(path.sep).join('/')
    const map: PathMap = {
      toGit: (p) => (prefix === '' ? p : `${prefix}/${p}`),
      fromGit: (p) =>
        prefix === '' ? p : p.startsWith(`${prefix}/`) ? p.slice(prefix.length + 1) : undefined,
    }
    return map
  })
