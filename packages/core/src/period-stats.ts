import { graphAsOf } from './asof'
import type { Freshness } from './freshness'
import { type History, weekStart } from './history'
import { lifecycles } from './lifecycle'
import type { Repo } from './ops/repo'
import { fieldsOf } from './views'

export type Period = '30d' | 'quarter' | 'year'

const lengths: Record<Period, number> = { '30d': 30, quarter: 90, year: 365 }

export interface Delta {
  readonly value: number
  /** The same measure over the period before; missing when it cannot be known. */
  readonly previous?: number
}

export interface PeriodStats {
  readonly period: Period
  /** `YYYY-MM-DD`, both ends included. */
  readonly from: string
  readonly to: string
  readonly kpis: {
    readonly created: Delta
    readonly done: Delta
    /** Days from first start to done, median over the tasks finished in the period. */
    readonly cycleDays: Delta | null
    /** Commits to the content folder. */
    readonly commits: Delta
    readonly staleDocs: Delta
  }
  /** Tasks created and finished per week (30 days, quarter) or per month (year). */
  readonly throughput: ReadonlyArray<{
    readonly start: string
    readonly created: number
    readonly done: number
  }>
  readonly areas: ReadonlyArray<{
    readonly area: string
    readonly goals: number
    /** Mean progress of its goals now, 0 to 1. */
    readonly share: number
    /** Points gained over the period (share now minus share at the start, in percent points). */
    readonly gained: number
    readonly achieved: number
    /** Goals still in progress that gained nothing. */
    readonly idle: number
  }>
  readonly projects: ReadonlyArray<{
    readonly id: string
    readonly title: string
    readonly done: number
    readonly cycleDays: number | null
  }>
  /** Commits per day over the last 53 weeks; days without commits are left out. */
  readonly heat: {
    readonly from: string
    readonly to: string
    readonly days: ReadonlyArray<{ readonly date: string; readonly count: number }>
  }
  readonly knowledge: {
    readonly freshness: {
      readonly fresh: number
      readonly drifting: number
      readonly stale: number
      readonly notTracked: number
    }
    readonly decisions: Readonly<Record<string, number>>
  }
  readonly approximate: boolean
}

export interface PeriodOptions {
  readonly period: Period
  readonly now?: string
  readonly freshness?: ReadonlyMap<string, Freshness>
}

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
const dayOf = (iso: string) => new Date(iso).toISOString().slice(0, 10)

const median = (values: ReadonlyArray<number>) => {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const value =
    sorted.length % 2 === 1
      ? (sorted[mid] as number)
      : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
  return Math.round(value * 10) / 10
}
const daysBetween = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000

/** The first day of the bucket a day falls in: its Monday, or for a year its month. */
const bucketOf = (period: Period, date: string) =>
  period === 'year' ? `${date.slice(0, 7)}-01` : weekStart(date)
const nextBucket = (period: Period, start: string) => {
  if (period !== 'year') return addDays(start, 7)
  const d = new Date(`${start}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * The numbers the Stats screen shows for a period, all read from the progression model
 * (ADR-00020): what was created and finished, how long work took, how goals moved, and the
 * health of knowledge. Every measure with a past is compared against the period before it.
 */
export const periodStats = (repo: Repo, history: History, options: PeriodOptions): PeriodStats => {
  const nowIso = options.now ?? new Date().toISOString()
  const to = dayOf(nowIso)
  const length = lengths[options.period]
  const from = addDays(to, -(length - 1))
  const prevTo = addDays(from, -1)
  const prevFrom = addDays(prevTo, -(length - 1))
  const states = repo.workspace.config.states
  const life = lifecycles(history, { states, now: nowIso })
  const inside = (iso: string | undefined, a: string, b: string) =>
    iso !== undefined && dayOf(iso) >= a && dayOf(iso) <= b

  const tasks = [...life.values()].filter((l) => l.type === 'task')
  const finishes = (a: string, b: string) =>
    tasks.flatMap((l) =>
      l.events
        .filter((e) => e.kind === 'finished' && inside(e.date, a, b))
        .map((e) => ({
          task: l.id,
          date: e.date,
          cycle: daysBetween(l.started ?? l.created ?? e.date, e.date),
        })),
    )
  const createdIn = (a: string, b: string) => tasks.filter((l) => inside(l.created, a, b)).length
  const commitsIn = (a: string, b: string) => history.log.filter((c) => inside(c.date, a, b)).length

  const nowDone = finishes(from, to)
  const prevDone = finishes(prevFrom, prevTo)
  const cycleNow = median(nowDone.map((f) => f.cycle))
  const cyclePrev = median(prevDone.map((f) => f.cycle))
  const stale = [...(options.freshness?.values() ?? [])].filter((f) => f.state === 'stale').length

  // Throughput by week or month.
  const buckets = new Map<string, { created: number; done: number }>()
  for (let b = bucketOf(options.period, from); b <= to; b = nextBucket(options.period, b)) {
    buckets.set(b, { created: 0, done: 0 })
  }
  for (const l of tasks)
    if (inside(l.created, from, to)) {
      const row = buckets.get(bucketOf(options.period, dayOf(l.created as string)))
      if (row) row.created++
    }
  for (const f of nowDone) {
    const row = buckets.get(bucketOf(options.period, dayOf(f.date)))
    if (row) row.done++
  }

  // Goals by area, and projects, from the graph at both ends of the period.
  const end = graphAsOf(repo, history, { asOf: nowIso, now: nowIso })
  const start = new Map(
    graphAsOf(repo, history, { asOf: from, now: nowIso }).nodes.map((n) => [n.id, n]),
  )
  const areaOf = (id: string) => {
    const item = repo.index.findById(id)[0]
    const area = item === undefined ? undefined : fieldsOf(item).area
    return typeof area === 'string' && area !== '' ? area : '—'
  }
  const byArea = new Map<
    string,
    { goals: number; share: number; was: number; achieved: number; idle: number }
  >()
  for (const g of end.nodes.filter((n) => n.type === 'goal')) {
    const key = areaOf(g.id)
    const row = byArea.get(key) ?? { goals: 0, share: 0, was: 0, achieved: 0, idle: 0 }
    const before = start.get(g.id)?.progress ?? 0
    const progress = g.progress ?? 0
    row.goals++
    row.share += progress
    row.was += before
    if (g.status === 'done' && start.get(g.id)?.status !== 'done') row.achieved++
    if (g.status === 'progress' && progress - before === 0) row.idle++
    byArea.set(key, row)
  }
  const areas = [...byArea]
    .map(([area, r]) => ({
      area,
      goals: r.goals,
      share: Math.round((r.share / r.goals) * 100) / 100,
      gained: Math.round(((r.share - r.was) / r.goals) * 100),
      achieved: r.achieved,
      idle: r.idle,
    }))
    .sort((a, b) => a.area.localeCompare(b.area))

  const parentOf = new Map(end.nodes.map((n) => [n.id, n.parent]))
  const projects = end.nodes
    .filter((n) => n.type === 'project')
    .map((p) => {
      const done = nowDone.filter((f) => parentOf.get(f.task) === p.id)
      return {
        id: p.id,
        title: p.title,
        done: done.length,
        cycleDays: median(done.map((f) => f.cycle)),
      }
    })
    .sort((a, b) => b.done - a.done || a.id.localeCompare(b.id))

  // Heat map: 53 weeks ending this week.
  const heatFrom = addDays(weekStart(to), -52 * 7)
  const counts = new Map<string, number>()
  for (const c of history.log) {
    const d = dayOf(c.date)
    if (d >= heatFrom && d <= to) counts.set(d, (counts.get(d) ?? 0) + 1)
  }

  const freshness = { fresh: 0, drifting: 0, stale: 0, notTracked: 0 }
  for (const f of options.freshness?.values() ?? []) {
    if (f.state === 'fresh') freshness.fresh++
    else if (f.state === 'drifting') freshness.drifting++
    else if (f.state === 'stale') freshness.stale++
    else freshness.notTracked++
  }
  const decisions: Record<string, number> = {}
  for (const item of repo.index.items()) {
    if (item.type !== 'adr') continue
    const status = fieldsOf(item).status
    if (typeof status === 'string') decisions[status] = (decisions[status] ?? 0) + 1
  }

  return {
    period: options.period,
    from,
    to,
    kpis: {
      created: { value: createdIn(from, to), previous: createdIn(prevFrom, prevTo) },
      done: { value: nowDone.length, previous: prevDone.length },
      cycleDays:
        cycleNow === null
          ? null
          : { value: cycleNow, ...(cyclePrev === null ? {} : { previous: cyclePrev }) },
      commits: { value: commitsIn(from, to), previous: commitsIn(prevFrom, prevTo) },
      staleDocs: { value: stale },
    },
    throughput: [...buckets].map(([s, r]) => ({ start: s, ...r })),
    areas,
    projects,
    heat: {
      from: heatFrom,
      to,
      days: [...counts]
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    },
    knowledge: { freshness, decisions },
    approximate: history.partial,
  }
}
