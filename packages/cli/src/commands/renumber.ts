import {
  type GitRepository,
  openRepo,
  pathMap,
  type Repo,
  renumber,
  workspaceGit,
} from '@netherite/core'
import { Effect, Path } from 'effect'
import { reportFailure } from '../errors'
import { type Env, type ExitCode, exitCodes, json } from '../output'

export interface RenumberCommandOptions {
  readonly dir: string
  /** An item's path, or its ID. */
  readonly target: string
  /** The ID to use instead of the next free one. */
  readonly to: string | undefined
  /** Files whose links to the old ID should follow the new one. */
  readonly rewriteIn: ReadonlyArray<string>
  /** Renumber exactly the item given, even if another item with the same ID is newer. */
  readonly exact: boolean
  readonly json: boolean
}

/** The path an input names: an ID, a path from here, or a path from the workspace root. */
const locate = (repo: Repo, path: Path.Path, cwd: string, input: string) => {
  const byId = repo.index.findById(input)
  if (byId.length === 1) return byId[0]?.path
  const root = repo.workspace.root
  const candidates = [path.relative(root, path.resolve(cwd, input)), input].map((p) =>
    p.split(path.sep).join('/'),
  )
  return candidates.find((candidate) => repo.index.get(candidate) !== undefined)
}

/** Of items that share an ID, the one first committed last, then the last by path. */
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

/**
 * Gives an item a new ID and rewrites links to it. When the ID is shared by several items (a
 * collision after merging branches) the newest one, by first commit, is the one renumbered,
 * as ADR-00004 says; `--exact` renumbers the one named. Links written by ID alone cannot say
 * which duplicate they meant, so they follow only when you list files with `--rewrite-in`.
 */
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

      let target = given
      const id = repo.index.get(given)?.id
      const same = id === undefined ? [] : repo.index.findById(id).map((i) => i.path)
      if (!options.exact && same.length > 1) {
        const git = yield* workspaceGit(repo.workspace)
        if (git !== undefined) {
          const map = yield* pathMap(git, repo.workspace.root)
          const picked = yield* newest(git, map, same)
          if (picked !== undefined && picked !== given) {
            env.out.error(
              `${id} is shared by ${same.length} items; renumbering the newest, ${picked}, instead of ${given}.`,
            )
            target = picked
          }
        }
      }

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
