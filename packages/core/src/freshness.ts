import type { CommitInfo, GitError, GitRepository } from '@netherite/git'
import type { Config } from '@netherite/schema'
import { Effect, type FileSystem, type Path } from 'effect'
import picomatch from 'picomatch'
import { pathMap } from './gitpaths'
import type { ScannedItem } from './scanned-item'
import type { WorkspaceIndex } from './workspace-index'

export type FreshnessState = 'fresh' | 'drifting' | 'stale' | 'not-tracked' | 'unknown'

export interface Freshness {
  readonly state: FreshnessState
  readonly commits: number
  readonly uncommitted: boolean
  readonly baseline:
    | { readonly source: 'reviewed_at'; readonly date: string }
    | { readonly source: 'last-commit'; readonly date: string; readonly hash: string }
    | undefined
  readonly atLeast: boolean
  readonly covers: ReadonlyArray<string>
  readonly reason?: 'no-covers' | 'superseded' | 'deprecated' | 'no-git' | 'shallow'
}

export type Thresholds = Pick<Config['freshness'], 'drifting' | 'stale'>

export const stateFor = (
  commits: number,
  thresholds: Thresholds,
): 'fresh' | 'drifting' | 'stale' =>
  commits >= thresholds.stale ? 'stale' : commits >= thresholds.drifting ? 'drifting' : 'fresh'

const globChars = /[*?[\]{}()!]/

const normalizeGlob = (pattern: string) =>
  pattern.trim().replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '')

export const compileCovers = (patterns: ReadonlyArray<string>): ((path: string) => boolean) => {
  const include: string[] = []
  const exclude: string[] = []
  for (const raw of patterns) {
    const negated = raw.trim().startsWith('!')
    const pattern = normalizeGlob(negated ? raw.trim().slice(1) : raw)
    if (pattern === '') continue
    const list = negated ? exclude : include
    if (globChars.test(pattern)) list.push(pattern)
    else list.push(pattern, `${pattern}/**`)
  }
  if (include.length === 0) return () => false
  const yes = picomatch(include, { dot: true })
  const no = exclude.length > 0 ? picomatch(exclude, { dot: true }) : undefined
  return (path) => yes(path) && !(no?.(path) ?? false)
}

const dayBefore = (date: string) => {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

const asStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    : []

const fieldsOf = (item: ScannedItem): Record<string, unknown> => {
  const data = item.parsed.frontmatter?.data
  return typeof data === 'object' && data !== null && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {}
}

interface Tracked {
  readonly item: ScannedItem
  readonly covers: ReadonlyArray<string>
  readonly test: (path: string) => boolean
  readonly baseline: Freshness['baseline']
}

export interface FreshnessInput {
  readonly index: WorkspaceIndex
  readonly git: GitRepository | undefined
  readonly thresholds: Thresholds
  readonly root: string
  readonly asOf?: string
}

export const computeFreshness = (input: FreshnessInput) =>
  Effect.gen(function* () {
    const { index, git, thresholds } = input
    const until =
      input.asOf === undefined
        ? undefined
        : input.asOf.length <= 10
          ? `${input.asOf}T23:59:59.999Z`
          : input.asOf
    const untilMs = until === undefined ? undefined : Date.parse(until)
    const upTo = (date: string) => untilMs === undefined || Date.parse(date) <= untilMs
    const result = new Map<string, Freshness>()
    const none = { commits: 0, uncommitted: false, baseline: undefined, atLeast: false }

    const candidates: Array<{ item: ScannedItem; covers: string[] }> = []
    for (const item of index.items()) {
      const fields = fieldsOf(item)
      const covers = asStrings(fields.covers)
      if (fields.status === 'superseded' || fields.status === 'deprecated') {
        result.set(item.path, { ...none, state: 'not-tracked', covers, reason: fields.status })
      } else if (covers.length === 0) {
        result.set(item.path, { ...none, state: 'not-tracked', covers, reason: 'no-covers' })
      } else {
        candidates.push({ item, covers })
      }
    }
    if (candidates.length === 0) return result as ReadonlyMap<string, Freshness>
    if (git === undefined) {
      for (const { item, covers } of candidates) {
        result.set(item.path, { ...none, state: 'unknown', covers, reason: 'no-git' })
      }
      return result as ReadonlyMap<string, Freshness>
    }

    const map = yield* pathMap(git, input.root)
    const inWorkspace = map.fromGit

    const boundary = new Set(yield* git.shallowBoundary)

    const tracked: Tracked[] = []
    for (const { item, covers } of candidates) {
      const reviewed = fieldsOf(item).reviewed_at
      let baseline: Freshness['baseline']
      if (
        typeof reviewed === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(reviewed) &&
        upTo(`${reviewed}T00:00:00.000Z`)
      ) {
        baseline = { source: 'reviewed_at', date: reviewed }
      } else {
        const gitPath = map.toGit(item.path)
        const [last] =
          until === undefined
            ? yield* git.log({ paths: [gitPath], limit: 1 })
            : (yield* git.log({ paths: [gitPath], limit: 200 })).filter((c) =>
                upTo(c.committerDate),
              )
        if (last !== undefined) {
          baseline = {
            source: 'last-commit',
            date: last.committerDate.slice(0, 10),
            hash: last.hash,
          }
        }
      }
      tracked.push({
        item,
        covers,
        test: compileCovers(covers),
        baseline,
      })
    }

    const dates = tracked.flatMap((t) => (t.baseline ? [t.baseline.date] : []))
    const history: ReadonlyArray<CommitInfo> = (
      dates.length === 0
        ? []
        : yield* git.log({
            after: dayBefore([...dates].sort()[0] as string),
            files: 'names',
          })
    ).filter((c) => upTo(c.committerDate))
    const edge = git.shallow ? history.find((c) => boundary.has(c.hash)) : undefined

    const status = until === undefined ? yield* git.status({ untracked: 'all' }) : { entries: [] }
    const dirty = status.entries
      .filter((e) => e.kind !== 'ignored')
      .flatMap((e) => [e.path, ...(e.from ? [e.from] : [])])
      .flatMap((p) => {
        const inside = inWorkspace(p)
        return inside === undefined ? [] : [inside]
      })

    for (const t of tracked) {
      const { item, covers, baseline } = t
      if (baseline === undefined) {
        result.set(item.path, { ...none, state: 'fresh', covers })
        continue
      }
      if (baseline.source === 'last-commit' && boundary.has(baseline.hash)) {
        result.set(item.path, {
          ...none,
          state: 'unknown',
          covers,
          baseline,
          reason: 'shallow',
          atLeast: true,
        })
        continue
      }

      let commits = 0
      for (const commit of history) {
        if (baseline.source === 'last-commit') {
          if (commit.hash === baseline.hash) break
        } else if (commit.committerDate.slice(0, 10) <= baseline.date) {
          continue
        }
        const touched = commit.files.some((f) => {
          const inside = inWorkspace(f.path)
          return inside !== undefined && inside !== item.path && t.test(inside)
        })
        if (touched) commits++
      }
      const uncommitted = dirty.some((p) => p !== item.path && t.test(p))
      if (uncommitted) commits++

      const atLeast = edge !== undefined && baseline.date < edge.committerDate.slice(0, 10)
      const state = stateFor(commits, thresholds)
      if (atLeast && state !== 'stale') {
        result.set(item.path, {
          state: 'unknown',
          commits,
          uncommitted,
          baseline,
          atLeast,
          covers,
          reason: 'shallow',
        })
      } else {
        result.set(item.path, { state, commits, uncommitted, baseline, atLeast, covers })
      }
    }
    return result as ReadonlyMap<string, Freshness>
  }) satisfies Effect.Effect<
    ReadonlyMap<string, Freshness>,
    GitError,
    FileSystem.FileSystem | Path.Path
  >
