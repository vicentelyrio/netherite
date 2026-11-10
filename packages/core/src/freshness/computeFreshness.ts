import type { CommitInfo, GitError } from '@netherite/git'
import { AdrStatus, FreshnessState } from '@netherite/schema'
import { Clock, Effect, type FileSystem, type Path } from 'effect'
import { pathMap } from '../gitpaths'
import type { ScannedItem } from '../scanned-item'
import { compileCovers } from './covers'
import type { Freshness, FreshnessInput, Tracked } from './freshness.types'
import { stateFor } from './stateFor'

const dayBefore = (date: string) => {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

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
    const none = {
      commits: 0,
      uncommitted: false,
      uncommittedFiles: [],
      baseline: undefined,
      atLeast: false,
    }

    const candidates: Array<{ item: ScannedItem; covers: string[] }> = []
    for (const item of index.items()) {
      const fields = fieldsOf(item)
      const covers = asStrings(fields.covers)
      if (fields.status === AdrStatus.Superseded || fields.status === AdrStatus.Deprecated) {
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

    const today = isoDay(yield* Clock.currentTimeMillis)

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
      const reviewedToday = baseline.source === 'reviewed_at' && baseline.date === today
      const uncommittedFiles = reviewedToday
        ? []
        : dirty.filter((p) => p !== item.path && t.test(p))
      const uncommitted = uncommittedFiles.length > 0
      if (uncommitted) commits++

      const atLeast = edge !== undefined && baseline.date < edge.committerDate.slice(0, 10)
      const state = stateFor(commits, thresholds)
      if (atLeast && state !== FreshnessState.Stale) {
        result.set(item.path, {
          state: 'unknown',
          commits,
          uncommitted,
          uncommittedFiles,
          baseline,
          atLeast,
          covers,
          reason: 'shallow',
        })
      } else {
        result.set(item.path, {
          state,
          commits,
          uncommitted,
          uncommittedFiles,
          baseline,
          atLeast,
          covers,
        })
      }
    }
    return result as ReadonlyMap<string, Freshness>
  }) satisfies Effect.Effect<
    ReadonlyMap<string, Freshness>,
    GitError,
    FileSystem.FileSystem | Path.Path
  >
