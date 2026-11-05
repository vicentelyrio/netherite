import type { GitError, GitRepository } from '@netherite/git'
import { Effect } from 'effect'
import { compileCovers } from './freshness'
import { pathMap } from './gitpaths'

export interface CoChanged {
  readonly path: string
  readonly commits: number
  readonly share: number
  readonly last: string
}

export interface CoChange {
  readonly item: string
  readonly itemCommits: number
  readonly files: ReadonlyArray<CoChanged>
  readonly partial: boolean
}

export interface CoChangeOptions {
  readonly contentRoot?: string
  readonly minCommits?: number
  readonly limit?: number
  readonly maxFilesPerCommit?: number
  readonly maxCommits?: number
  readonly exclude?: ReadonlyArray<string>
}

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
  readonly glob: string
  readonly files: ReadonlyArray<string>
  readonly commits: number
}

export interface SuggestOptions {
  readonly existing?: ReadonlyArray<string>
  readonly minShare?: number
  readonly max?: number
}

const directoryOf = (path: string) => {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? '' : path.slice(0, slash)
}

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
