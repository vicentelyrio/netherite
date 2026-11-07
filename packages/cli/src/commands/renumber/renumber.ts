import {
  type GitRepository,
  openRepo,
  pathMap,
  type Repo,
  renumber,
  workspaceGit,
} from '@netherite/core'
import { Effect, Path } from 'effect'
import { reportFailure } from '../../errors'
import { type Env, type ExitCode, exitCodes, json } from '../../output'

export interface RenumberCommandOptions {
  readonly dir: string
  readonly target: string
  readonly to: string | undefined
  readonly rewriteIn: ReadonlyArray<string>
  readonly exact: boolean
  readonly json: boolean
}

const locate = (repo: Repo, path: Path.Path, cwd: string, input: string) => {
  const byId = repo.index.findById(input)
  if (byId.length === 1) return byId[0]?.path
  const root = repo.workspace.root
  const candidates = [path.relative(root, path.resolve(cwd, input)), input].map((p) =>
    p.split(path.sep).join('/'),
  )
  return candidates.find((candidate) => repo.index.get(candidate) !== undefined)
}

const newest = (
  git: GitRepository,
  map: { toGit: (p: string) => string },
  paths: ReadonlyArray<string>,
) =>
  Effect.gen(function* () {
    const dated: Array<{ path: string; date: string }> = []
    for (const p of paths) {
      const first = yield* git.firstCommit(map.toGit(p)).pipe(Effect.orElseSucceed(() => undefined))
      dated.push({ path: p, date: first?.committerDate ?? '9999' })
    }
    return dated
      .sort((a, b) =>
        a.date === b.date ? a.path.localeCompare(b.path) : a.date.localeCompare(b.date),
      )
      .at(-1)?.path
  })

const newestOf = (workspace: Repo['workspace'], paths: ReadonlyArray<string>) =>
  Effect.gen(function* () {
    const git = yield* workspaceGit(workspace)
    if (git === undefined) return undefined
    const map = yield* pathMap(git, workspace.root)
    return yield* newest(git, map, paths)
  })

export const renumberCommand = (env: Env, options: RenumberCommandOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path
    const run = Effect.gen(function* () {
      const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
      const given = locate(repo, path, env.cwd, options.target)
      if (given === undefined) {
        env.out.error(`No item found for "${options.target}". Give a path or an ID.`)
        return exitCodes.usage as ExitCode
      }

      const id = repo.index.get(given)?.id
      const same = id === undefined ? [] : repo.index.findById(id).map((i) => i.path)
      const picked =
        !options.exact && same.length > 1 ? yield* newestOf(repo.workspace, same) : undefined
      if (picked !== undefined && picked !== given) {
        env.out.error(
          `${id} is shared by ${same.length} items; renumbering the newest, ${picked}, instead of ${given}.`,
        )
      }
      const target = picked ?? given

      const rewriteIn = options.rewriteIn.map((p) =>
        path.relative(repo.workspace.root, path.resolve(env.cwd, p)).split(path.sep).join('/'),
      )
      const result = yield* renumber(repo, target, {
        ...(options.to === undefined ? {} : { newId: options.to }),
        rewriteReferencesIn: rewriteIn,
      })
      if (options.json) {
        json(env.out, {
          oldId: result.oldId,
          newId: result.newId,
          oldPath: result.oldPath,
          path: result.path,
          rewritten: result.rewritten,
        })
      } else {
        env.out.line(`${result.oldId} -> ${result.newId}`)
        env.out.line(`  ${result.oldPath} -> ${result.path}`)
        for (const file of result.rewritten) env.out.line(`  links updated in ${file}`)
        if (same.length > 1 && options.rewriteIn.length === 0) {
          env.out.line(
            `  Links written as [[${result.oldId}]] still point at the other item; use --rewrite-in <file> for files that meant this one.`,
          )
        }
      }
      return exitCodes.ok as ExitCode
    })
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })
