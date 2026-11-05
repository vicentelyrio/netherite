import type { GitError, GitRepository } from '@netherite/git'
import { Effect } from 'effect'
import { compileCovers } from './freshness'
import { pathMap } from './gitpaths'

/** A code file that kept changing while no knowledge changed with it. */
export interface Undocumented {
  /** Path relative to the workspace root. */
  readonly path: string
  /** Commits in the period that changed it and no file of the content folder. */
  readonly commits: number
  /** Date of the latest such commit, `YYYY-MM-DD`. */
  readonly last: string
}

export interface UndocumentedOptions {
  /** Content folder relative to the workspace, such as `netherite`: its files are the knowledge. */
  readonly contentRoot: string
  /** First and last day of the period, `YYYY-MM-DD`. */
  readonly from: string
  readonly to: string
  /** Fewest commits for a file to be listed. Default 2. */
  readonly minCommits?: number
  /** Most files listed. Default 5. */
  readonly limit?: number
  /** Skip commits that changed more files than this (mass renames, imports). Default 40. */
  readonly maxFilesPerCommit?: number
  /** Globs of files never to list. Default: lock files. */
  readonly exclude?: ReadonlyArray<string>
}

const dayBefore = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return `${d.toISOString().slice(0, 10)}T23:59:59Z`
}

/**
 * The code that changed most often in a period without a knowledge file changing in the same
 * commit: where the docs are most likely to have fallen behind. Commits that touched the content
 * folder count as a doc update, so the files in them are left out of the tally.
 */
export const undocumentedChurn = (
  git: GitRepository,
  workspaceRoot: string,
  options: UndocumentedOptions,
): Effect.Effect<
  ReadonlyArray<Undocumented>,
  GitError,
  import('effect').FileSystem.FileSystem | import('effect').Path.Path
> =>
  Effect.gen(function* () {
    const map = yield* pathMap(git, workspaceRoot)
    const prefix = `${options.contentRoot.replace(/\/$/, '')}/`
    const maxFiles = options.maxFilesPerCommit ?? 40
    const excluded = compileCovers(
      options.exclude ?? ['**/pnpm-lock.yaml', '**/package-lock.json', '**/yarn.lock', '**/*.lock'],
    )
    const commits = yield* git.log({ after: dayBefore(options.from), files: 'names' })

    const tally = new Map<string, { commits: number; last: string }>()
    for (const commit of commits) {
      const date = commit.committerDate.slice(0, 10)
      if (date < options.from || date > options.to) continue
      if (commit.files.length > maxFiles) continue
      const paths = commit.files.flatMap((f) => {
        const path = map.fromGit(f.path)
        return path === undefined ? [] : [path]
      })
      if (paths.some((p) => p.startsWith(prefix))) continue
      for (const path of paths) {
        if (path.startsWith('.netherite/') || excluded(path)) continue
        const entry = tally.get(path)
        if (entry === undefined) tally.set(path, { commits: 1, last: date })
        else {
          entry.commits++
          if (date > entry.last) entry.last = date
        }
      }
    }
    return [...tally]
      .filter(([, t]) => t.commits >= (options.minCommits ?? 2))
      .map(([path, t]): Undocumented => ({ path, ...t }))
      .sort((a, b) => b.commits - a.commits || a.path.localeCompare(b.path))
      .slice(0, options.limit ?? 5)
  })

export interface Linkage {
  /** Commits in the period. */
  readonly total: number
  /** Those that changed a file of the content folder or name an item (`TASK-00012`). */
  readonly linked: number
}

const itemId = /\b(?:GOAL|PRJ|TASK|ADR|DOC|CTX|RUN)-\d{5}\b/

/**
 * How many commits in a period are tied to work the workspace tracks: they change a file in the
 * content folder, or their message names an item. The rest changed code with nothing recorded.
 */
export const linkedCommits = (
  git: GitRepository,
  workspaceRoot: string,
  options: { readonly contentRoot: string; readonly from: string; readonly to: string },
): Effect.Effect<
  Linkage,
  GitError,
  import('effect').FileSystem.FileSystem | import('effect').Path.Path
> =>
  Effect.gen(function* () {
    const map = yield* pathMap(git, workspaceRoot)
    const prefix = `${options.contentRoot.replace(/\/$/, '')}/`
    const commits = yield* git.log({ after: dayBefore(options.from), files: 'names' })
    let total = 0
    let linked = 0
    for (const commit of commits) {
      const date = commit.committerDate.slice(0, 10)
      if (date < options.from || date > options.to) continue
      total++
      const touches = commit.files.some((f) => map.fromGit(f.path)?.startsWith(prefix) === true)
      if (touches || itemId.test(commit.subject)) linked++
    }
    return { total, linked }
  })
