import type { CommitPatch, FilePatch, GitError, GitRepository } from '@netherite/git'
import { Effect, type FileSystem, type Path } from 'effect'
import { parseDocument } from 'yaml'
import { pathMap } from './gitpaths'

export interface Author {
  readonly name: string
  readonly email: string
}

/** A frontmatter field's value in history. Lists such as `goals` are kept as lists. */
export type FieldValue = string | ReadonlyArray<string> | undefined

export interface Transition {
  /** The item's ID, so a renamed or renumbered file keeps one history. */
  readonly id: string
  readonly type: string | undefined
  readonly field: string
  readonly from: FieldValue
  readonly to: FieldValue
  /**
   * `created`: the commit added the file. `changed`: the value changed. `seen`: the first
   * time it was seen in a limited window of history, so its earlier value is not known.
   */
  readonly kind: 'created' | 'changed' | 'seen'
  readonly hash: string
  /** Commit date, ISO 8601. */
  readonly date: string
  readonly author: Author
}

export interface AuthorSummary extends Author {
  readonly commits: number
  /** `YYYY-MM-DD`. */
  readonly first: string
  readonly last: string
}

export interface ItemHistory {
  readonly id: string
  readonly type: string | undefined
  /** Every path the item has had, in the order it had them. */
  readonly paths: ReadonlyArray<string>
  readonly transitions: ReadonlyArray<Transition>
  /** Who changed the item, most commits first. */
  readonly authors: ReadonlyArray<AuthorSummary>
  readonly created:
    | { readonly hash: string; readonly date: string; readonly author: Author }
    | undefined
  /** Set when the file was removed and not brought back. */
  readonly deletedAt: string | undefined
  readonly commits: number
}

export interface History {
  readonly items: ReadonlyMap<string, ItemHistory>
  /** Commits that touched the content folder. */
  readonly commits: number
  /** `true` when old history is missing: a shallow clone, or a `limit` or `after` window. */
  readonly partial: boolean
}

export interface HistoryOptions {
  /** Content root relative to the workspace, such as `netherite`. */
  readonly contentRoot: string
  /** Frontmatter fields to follow. Default: `status`, `state`, `project`, `goals`. */
  readonly fields?: ReadonlyArray<string>
  /** Only commits after this date (ISO 8601). */
  readonly after?: string
  /** Only this many of the latest commits. */
  readonly limit?: number
}

export const defaultTrackedFields = ['status', 'state', 'project', 'goals'] as const

/**
 * The top of the file's frontmatter after the commit, if the diff shows it: `null` if the file
 * was deleted, `undefined` if the commit did not show the frontmatter (a body-only change).
 */
const frontmatterAfter = (patch: FilePatch): Record<string, unknown> | null | undefined => {
  if (patch.deleted) return null
  const hunk = patch.hunks.find((h) => h.newStart === 1)
  if (hunk === undefined || hunk.lines[0]?.trim() !== '---') return undefined
  const close = hunk.lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  if (close === -1) return undefined
  const doc = parseDocument(hunk.lines.slice(1, close).join('\n'))
  if (doc.errors.length > 0) return undefined
  const data = doc.toJS() as unknown
  return typeof data === 'object' && data !== null && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : undefined
}

const asValue = (value: unknown): FieldValue => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return undefined
}

const same = (a: FieldValue, b: FieldValue) => JSON.stringify(a) === JSON.stringify(b)

interface Builder {
  id: string
  type: string | undefined
  paths: string[]
  transitions: Transition[]
  fields: Map<string, FieldValue>
  authors: Map<string, { author: Author; commits: number; first: string; last: string }>
  created: ItemHistory['created']
  deletedAt: string | undefined
  commits: number
  /** The latest commit already counted, so a commit that touches two paths of one item counts once. */
  lastCounted: string | undefined
}

/**
 * Reads how items changed over time from git (ADR-00007). It looks at every commit that touched
 * the content folder, reads each changed file's frontmatter after the commit from the diff, and
 * records every time a followed field changed, who changed each item, and when it was created
 * or removed. Items are tracked by ID, so renaming or renumbering a file keeps its history.
 */
export const readHistory = (
  git: GitRepository,
  workspaceRoot: string,
  options: HistoryOptions,
): Effect.Effect<History, GitError, FileSystem.FileSystem | Path.Path> =>
  Effect.gen(function* () {
    const map = yield* pathMap(git, workspaceRoot)
    const tracked = options.fields ?? defaultTrackedFields
    const prefix = `${options.contentRoot.replace(/\/$/, '')}/`

    const commits: ReadonlyArray<CommitPatch> = yield* git.patchLog({
      paths: [map.toGit(options.contentRoot)],
      context: 200,
      ...(options.after === undefined ? {} : { after: options.after }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    })

    const items = new Map<string, Builder>()
    const pathId = new Map<string, string>()
    const windowed = options.after !== undefined || options.limit !== undefined

    // Oldest first, so each commit builds on what came before.
    for (const commit of [...commits].reverse()) {
      for (const patch of commit.patches) {
        const path = map.fromGit(patch.path)
        if (path === undefined || !path.startsWith(prefix) || !path.toLowerCase().endsWith('.md'))
          continue
        if (
          path
            .slice(prefix.length)
            .split('/')
            .some((part) => part.startsWith('.') || part === 'assets')
        )
          continue

        const front = frontmatterAfter(patch)
        const known = pathId.get(path)
        const id = front && typeof front.id === 'string' && front.id !== '' ? front.id : known

        if (front === null) {
          pathId.delete(path)
          if (id === undefined) continue
        } else if (id !== undefined) {
          pathId.set(path, id)
        }
        if (id === undefined) continue

        let item = items.get(id)
        if (item === undefined) {
          item = {
            id,
            type: undefined,
            paths: [],
            transitions: [],
            fields: new Map(),
            authors: new Map(),
            created: undefined,
            deletedAt: undefined,
            commits: 0,
            lastCounted: undefined,
          }
          items.set(id, item)
        }
        if (!item.paths.includes(path)) item.paths.push(path)
        if (front && typeof front.type === 'string') item.type = front.type
        if (item.created === undefined && patch.added) {
          item.created = { hash: commit.hash, date: commit.committerDate, author: commit.author }
        }
        item.deletedAt = front === null ? commit.committerDate : undefined

        // A commit that touches two paths of one item (a rename) counts once.
        if (item.lastCounted !== commit.hash) {
          item.lastCounted = commit.hash
          item.commits++
          const key = (commit.author.email || commit.author.name).toLowerCase()
          const seen = item.authors.get(key)
          const day = utcDay(commit.committerDate)
          if (seen === undefined) {
            item.authors.set(key, { author: commit.author, commits: 1, first: day, last: day })
          } else {
            seen.commits++
            if (day > seen.last) seen.last = day
            if (day < seen.first) seen.first = day
          }
        }

        if (!front) continue
        const firstSight = item.fields.size === 0 && item.transitions.length === 0
        for (const field of tracked) {
          const next = asValue(front[field])
          const before = item.fields.get(field)
          if (same(before, next)) continue
          item.fields.set(field, next)
          // A value that first shows up in a commit that did not add the file is the start of the window.
          const kind = patch.added
            ? 'created'
            : before === undefined && (windowed || firstSight)
              ? 'seen'
              : 'changed'
          item.transitions.push({
            id,
            type: item.type,
            field,
            from: before,
            to: next,
            kind,
            hash: commit.hash,
            date: commit.committerDate,
            author: commit.author,
          })
        }
      }
    }

    const result = new Map<string, ItemHistory>()
    for (const [id, b] of items) {
      result.set(id, {
        id,
        type: b.type,
        paths: b.paths,
        transitions: b.transitions.map((t) => ({ ...t, type: b.type })),
        authors: [...b.authors.values()]
          .map((a) => ({ ...a.author, commits: a.commits, first: a.first, last: a.last }))
          .sort(
            (x, y) =>
              y.commits - x.commits ||
              (x.last < y.last ? 1 : x.last > y.last ? -1 : 0) ||
              x.email.localeCompare(y.email),
          ),
        created: b.created,
        deletedAt: b.deletedAt,
        commits: b.commits,
      })
    }
    return { items: result, commits: commits.length, partial: git.shallow || windowed }
  })

// ---------------------------------------------------------------------------------------------
// Queries

const byTime = (a: { date: string }, b: { date: string }) => Date.parse(a.date) - Date.parse(b.date)

/** Who changed an item, most commits first. Empty for an unknown ID. */
export const authorsOf = (history: History, id: string): ReadonlyArray<AuthorSummary> =>
  history.items.get(id)?.authors ?? []

/** Every `status` change of every ADR, oldest first: the decision log. */
export const decisionLog = (history: History): ReadonlyArray<Transition> =>
  [...history.items.values()]
    .filter((item) => item.type === 'adr')
    .flatMap((item) => item.transitions.filter((t) => t.field === 'status'))
    .sort(byTime)

/** Every `state` change of every task, oldest first. */
export const taskTransitions = (history: History): ReadonlyArray<Transition> =>
  [...history.items.values()]
    .filter((item) => item.type === 'task')
    .flatMap((item) => item.transitions.filter((t) => t.field === 'state'))
    .sort(byTime)

/**
 * The UTC calendar day of an ISO 8601 timestamp, as `YYYY-MM-DD`. Commit dates carry their
 * author's offset (`2026-11-01T21:07:44-03:00` is already November 2 in UTC), and weeks are
 * counted in UTC so they are the same on every machine. A plain date is returned as it is.
 */
const utcDay = (iso: string) => {
  if (iso.length <= 10) return iso
  const time = Date.parse(iso)
  return Number.isNaN(time) ? iso.slice(0, 10) : new Date(time).toISOString().slice(0, 10)
}

/** The Monday (UTC) of the week a date falls in, as `YYYY-MM-DD`. */
export const weekStart = (date: string) => {
  const d = new Date(`${utcDay(date)}T00:00:00Z`)
  const back = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Every week from `from` to `to` (inclusive), as Monday dates. */
const weeksBetween = (from: string, to: string) => {
  const weeks: string[] = []
  for (let week = weekStart(from); week <= weekStart(to); week = addDays(week, 7)) weeks.push(week)
  return weeks
}

export interface WeekRange {
  /** First day to include, `YYYY-MM-DD`. Default: the earliest event. */
  readonly from?: string
  /** Last day to include. Default: the latest event. */
  readonly to?: string
}

export interface WeekCount {
  /** The Monday that starts the week. */
  readonly week: string
  readonly count: number
}

/**
 * Tasks that reached a done state, per week. A task counts each time it moves into a done state
 * from one that is not (so reopening and finishing again counts twice); a task created already
 * done counts once. Weeks with none are included with 0.
 */
export const completionsByWeek = (
  history: History,
  doneStates: ReadonlySet<string>,
  range: WeekRange = {},
): ReadonlyArray<WeekCount> => {
  const done = taskTransitions(history).filter(
    (t) =>
      typeof t.to === 'string' &&
      doneStates.has(t.to) &&
      !(typeof t.from === 'string' && doneStates.has(t.from)),
  )
  const dates = done.map((t) => utcDay(t.date))
  const from =
    range.from ??
    dates.reduce<string | undefined>((a, b) => (a === undefined || b < a ? b : a), undefined)
  const to =
    range.to ??
    dates.reduce<string | undefined>((a, b) => (a === undefined || b > a ? b : a), undefined)
  if (from === undefined || to === undefined) return []
  const counts = new Map(weeksBetween(from, to).map((week) => [week, 0]))
  for (const transition of done) {
    const week = weekStart(transition.date)
    if (counts.has(week)) counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  return [...counts].map(([week, count]) => ({ week, count }))
}

export interface AdrWeek {
  readonly week: string
  readonly proposed: number
  readonly accepted: number
  readonly deprecated: number
  readonly superseded: number
}

/** ADR status changes per week, by the status they moved to. */
export const adrActivityByWeek = (
  history: History,
  range: WeekRange = {},
): ReadonlyArray<AdrWeek> => {
  const log = decisionLog(history)
  const dates = log.map((t) => utcDay(t.date))
  const from = range.from ?? dates[0]
  const to = range.to ?? dates.at(-1)
  if (from === undefined || to === undefined) return []
  const weeks = new Map<string, { -readonly [K in keyof AdrWeek]: AdrWeek[K] }>(
    weeksBetween(from, to).map((week) => [
      week,
      { week, proposed: 0, accepted: 0, deprecated: 0, superseded: 0 },
    ]),
  )
  for (const t of log) {
    const row = weeks.get(weekStart(t.date))
    if (
      row !== undefined &&
      (t.to === 'proposed' || t.to === 'accepted' || t.to === 'deprecated' || t.to === 'superseded')
    ) {
      row[t.to]++
    }
  }
  return [...weeks.values()]
}

export interface ProgressPoint {
  /** The Monday that starts the week; the counts are as of the end of that week. */
  readonly week: string
  readonly done: number
  readonly total: number
}

export interface ProgressSeries {
  readonly projects: ReadonlyMap<string, ReadonlyArray<ProgressPoint>>
  readonly goals: ReadonlyMap<string, ReadonlyArray<ProgressPoint>>
}

const valueAt = (item: ItemHistory, field: string, before: number): FieldValue => {
  let value: FieldValue
  for (const t of item.transitions) {
    if (t.field !== field) continue
    if (Date.parse(t.date) >= before) break
    value = t.to
  }
  return value
}

/**
 * How many tasks each project and goal had, and how many were done, at the end of each week.
 * It replays history: a task counts from the commit that created it until the one that deleted
 * it, in the project it belonged to at the time; a goal counts the tasks of its projects.
 */
export const progressSeries = (
  history: History,
  doneStates: ReadonlySet<string>,
  range: WeekRange = {},
): ProgressSeries => {
  const items = [...history.items.values()]
  const stamps = items.flatMap((i) => [
    ...i.transitions.map((t) => utcDay(t.date)),
    ...(i.deletedAt ? [utcDay(i.deletedAt)] : []),
  ])
  const from =
    range.from ??
    stamps.reduce<string | undefined>((a, b) => (a === undefined || b < a ? b : a), undefined)
  const to =
    range.to ??
    stamps.reduce<string | undefined>((a, b) => (a === undefined || b > a ? b : a), undefined)
  const projects = new Map<string, ProgressPoint[]>()
  const goals = new Map<string, ProgressPoint[]>()
  if (from === undefined || to === undefined) return { projects, goals }

  const tasks = items.filter((i) => i.type === 'task')
  const projectItems = items.filter((i) => i.type === 'project')
  const point = (
    series: Map<string, ProgressPoint[]>,
    id: string,
    week: string,
    done: number,
    total: number,
  ) => {
    const list = series.get(id) ?? []
    list.push({ week, done, total })
    series.set(id, list)
  }

  for (const week of weeksBetween(from, to)) {
    const end = Date.parse(`${addDays(week, 7)}T00:00:00Z`)
    const perProject = new Map<string, { done: number; total: number }>()
    for (const task of tasks) {
      const born = task.created
        ? Date.parse(task.created.date)
        : task.transitions[0]
          ? Date.parse(task.transitions[0].date)
          : undefined
      if (born === undefined || born >= end) continue
      if (task.deletedAt !== undefined && Date.parse(task.deletedAt) < end) continue
      const project = valueAt(task, 'project', end)
      if (typeof project !== 'string') continue
      const state = valueAt(task, 'state', end)
      const row = perProject.get(project) ?? { done: 0, total: 0 }
      row.total++
      if (typeof state === 'string' && doneStates.has(state)) row.done++
      perProject.set(project, row)
    }
    const perGoal = new Map<string, { done: number; total: number }>()
    for (const [project, row] of perProject) {
      point(projects, project, week, row.done, row.total)
      const item = projectItems.find((p) => p.id === project)
      const linked = item === undefined ? undefined : valueAt(item, 'goals', end)
      for (const goal of Array.isArray(linked) ? linked : []) {
        const sum = perGoal.get(goal) ?? { done: 0, total: 0 }
        sum.done += row.done
        sum.total += row.total
        perGoal.set(goal, sum)
      }
    }
    for (const [goal, sum] of perGoal) point(goals, goal, week, sum.done, sum.total)
  }
  return { projects, goals }
}
