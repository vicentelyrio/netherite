import type { GitError, GitRepository } from '@netherite/git'
import { Effect } from 'effect'
import { compileCovers } from './freshness'
import { pathMap } from './gitpaths'

/** A file that changes together with an item. */
export interface CoChanged {
  /** Path relative to the workspace root. */
  readonly path: string
  /** Commits that changed both the item and this file. */
  readonly commits: number
  /** `commits` as a share of the item's commits, from 0 to 1. */
  readonly share: number
  /** Date of the latest such commit, `YYYY-MM-DD`. */
  readonly last: string
}

export interface CoChange {
  /** The item's workspace path. */
  readonly item: string
  /** Commits that touched the item. */
  readonly itemCommits: number
  /** Files that changed with it, most often first. */
  readonly files: ReadonlyArray<CoChanged>
  /** `true` in a shallow clone, where older commits are missing. */
  readonly partial: boolean
}

export interface CoChangeOptions {
  /** Content root relative to the workspace, such as `netherite`. Its files are left out: they are the knowledge, not the code. */
  readonly contentRoot?: string
  /** Fewest shared commits for a file to be listed. Default 2. */
  readonly minCommits?: number
  /** Most files listed. Default 10. */
  readonly limit?: number
  /** Ignore commits that changed more files than this (mass renames, imports). Default 40. */
  readonly maxFilesPerCommit?: number
  /** Look only at this many of the item's latest commits. Default 200. */
  readonly maxCommits?: number
  /** Globs of files never to list, such as lock files. */
  readonly exclude?: ReadonlyArray<string>
}

/**
 * The files most often changed in the same commits as an item's file (ADR-00009). Commits that
 * changed very many files say little about what belongs together, so they are skipped. The item
 * itself, the workspace's own knowledge files and `.netherite/` are never listed.
 */
export const coChanged = (
  git: GitRepository,
  workspaceRoot: string,
  itemPath: string,
  options: CoChangeOptions = {},
): Effect.Effect<
  CoChange,
  GitError,
  import('effect').FileSystem.FileSystem | import('effect').Path.Path
> =>
  Effect.gen(function* () {
    const map = yield* pathMap(git, workspaceRoot)
    const minCommits = options.minCommits ?? 2
    const maxFiles = options.maxFilesPerCommit ?? 40
    const contentPrefix =
      options.contentRoot === undefined || options.contentRoot === ''
        ? undefined
        : `${options.contentRoot.replace(/\/$/, '')}/`
    const excluded = options.exclude === undefined ? () => false : compileCovers(options.exclude)

    const touching = yield* git.log({
      paths: [map.toGit(itemPath)],
      limit: options.maxCommits ?? 200,
    })
    const commits = yield* git.readCommits(
      touching.map((c) => c.hash),
      { files: 'names' },
    )

    const tally = new Map<string, { commits: number; last: string }>()
    let used = 0
    for (const commit of commits) {
      if (commit.files.length > maxFiles) continue
      used++
      const date = commit.committerDate.slice(0, 10)
      for (const file of commit.files) {
        const path = map.fromGit(file.path)
        if (path === undefined || path === itemPath) continue
        if (path.startsWith('.netherite/')) continue
        if (contentPrefix !== undefined && path.startsWith(contentPrefix)) continue
        if (excluded(path)) continue
        const entry = tally.get(path)
        if (entry === undefined) tally.set(path, { commits: 1, last: date })
        else {
          entry.commits++
          if (date > entry.last) entry.last = date
        }
      }
    }

    const files = [...tally]
      .filter(([, t]) => t.commits >= minCommits)
      .map(
        ([path, t]): CoChanged => ({
          path,
          commits: t.commits,
          share: used === 0 ? 0 : t.commits / used,
          last: t.last,
        }),
      )
      .sort(
        (a, b) =>
          b.commits - a.commits ||
          (a.last < b.last ? 1 : a.last > b.last ? -1 : 0) ||
          a.path.localeCompare(b.path),
      )
      .slice(0, options.limit ?? 10)

    return { item: itemPath, itemCommits: commits.length, files, partial: git.shallow }
  })

export interface CoverSuggestion {
  /** A path or glob to add to `covers`. */
  readonly glob: string
  /** The co-changed files it stands for. */
  readonly files: ReadonlyArray<string>
  /** Commits of the file that changed most with the item. */
  readonly commits: number
}

export interface SuggestOptions {
  /** The item's current `covers`; files they already cover are not suggested. */
  readonly existing?: ReadonlyArray<string>
  /** Only files that changed with at least this share of the item's commits. Default 0.25. */
  readonly minShare?: number
  /** Most suggestions. Default 5. */
  readonly max?: number
}

const directoryOf = (path: string) => {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? '' : path.slice(0, slash)
}

/**
 * Turns co-changed files into `covers:` entries. Files that share a folder become `folder/**`;
 * a file on its own stays a plain path. Files already covered are left out.
 */
export const suggestCovers = (
  change: Pick<CoChange, 'files'>,
  options: SuggestOptions = {},
): CoverSuggestion[] => {
  const covered = compileCovers(options.existing ?? [])
  const minShare = options.minShare ?? 0.25
  const candidates = change.files.filter((f) => f.share >= minShare && !covered(f.path))

  const byFolder = new Map<string, CoChanged[]>()
  for (const file of candidates) {
    const folder = directoryOf(file.path)
    byFolder.set(folder, [...(byFolder.get(folder) ?? []), file])
  }

  const suggestions: CoverSuggestion[] = []
  for (const [folder, files] of byFolder) {
    const commits = Math.max(...files.map((f) => f.commits))
    if (folder !== '' && files.length >= 2) {
      suggestions.push({ glob: `${folder}/**`, files: files.map((f) => f.path).sort(), commits })
    } else {
      for (const file of files)
        suggestions.push({ glob: file.path, files: [file.path], commits: file.commits })
    }
  }
  return suggestions
    .sort((a, b) => b.commits - a.commits || a.glob.localeCompare(b.glob))
    .slice(0, options.max ?? 5)
}
