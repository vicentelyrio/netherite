import type { GitRepository } from '@netherite/git'
import { Effect, FileSystem, Path } from 'effect'

export interface PathMap {
  readonly toGit: (workspacePath: string) => string
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
