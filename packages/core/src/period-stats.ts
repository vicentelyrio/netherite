import { graphAsOf } from './asof'
import type { Freshness } from './freshness'
import { type History, weekStart } from './history'
import { lifecycles } from './lifecycle'
import type { Repo } from './ops/repo'
import { fieldsOf } from './views'

export type Period = '30d' | 'quarter' | 'year'

const percentOf = (l: { total: number; linked: number }) =>
  l.total === 0 ? 0 : Math.round((l.linked / l.total) * 100)

const lengths: Record<Period, number> = { '30d': 30, quarter: 90, year: 365 }

export interface Delta {
  readonly value: number
  readonly previous?: number
}

export interface PeriodStats {
  readonly period: Period
  readonly from: string
  readonly to: string
  readonly kpis: {
    readonly created: Delta
    readonly done: Delta
    readonly cycleDays: Delta | null
    readonly commits: Delta
    readonly staleDocs: Delta
    readonly linked?: {
      readonly percent: number
      readonly total: number
      readonly previous?: number
    }
  }
  readonly throughput: ReadonlyArray<{
    readonly start: string
    readonly created: number
    readonly done: number
  }>
  readonly areas: ReadonlyArray<{
    readonly area: string
    readonly goals: number
    readonly share: number
    readonly gained: number
    readonly achieved: number
    readonly achievedGoals: ReadonlyArray<string>
    readonly idleGoals: ReadonlyArray<string>
    readonly goalRows: ReadonlyArray<{
      readonly title: string
      readonly share: number
      readonly gained: number
    }>
    readonly idle: number
  }>
  readonly projects: ReadonlyArray<{
    readonly id: string
    readonly title: string
    readonly done: number
    readonly cycleDays: number | null
  }>
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
    readonly decided: Readonly<Record<string, number>>
    readonly undocumented: ReadonlyArray<{
      readonly path: string
      readonly commits: number
      readonly last: string
    }>
  }
  readonly areaNames: ReadonlyArray<string>
  readonly approximate: boolean
}

export interface PeriodOptions {
  readonly period: Period
  readonly now?: string
  readonly freshness?: ReadonlyMap<string, Freshness>
  readonly linkage?: {
    readonly current: { readonly total: number; readonly linked: number }
    readonly previous: { readonly total: number; readonly linked: number }
  }
  readonly undocumented?: ReadonlyArray<{
    readonly path: string
    readonly commits: number
    readonly last: string
  }>
  readonly area?: string
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

const bucketOf = (period: Period, date: string) =>
  period === 'year' ? `${date.slice(0, 7)}-01` : weekStart(date)
const nextBucket = (period: Period, start: string) => {
  if (period !== 'year') return addDays(start, 7)
  const d = new Date(`${start}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().slice(0, 10)
}

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

  const end = graphAsOf(repo, history, { asOf: nowIso, now: nowIso })
  const start = new Map(
    graphAsOf(repo, history, { asOf: from, now: nowIso }).nodes.map((n) => [n.id, n]),
  )
  const areaOf = (id: string) => {
    const item = repo.index.findById(id)[0]
    const area = item === undefined ? undefined : fieldsOf(item).area
    return typeof area === 'string' && area !== '' ? area : '—'
  }
  const parentOf = new Map(end.nodes.map((n) => [n.id, n.parent]))
  const goalOf = (id: string) => {
    let at: string | undefined = id
    for (let hops = 0; at !== undefined && hops < 4; hops++) {
      if (end.nodes.find((n) => n.id === at)?.type === 'goal') return at
      at = parentOf.get(at)
    }
    return undefined
  }
  const inArea = (id: string) => {
    if (options.area === undefined) return true
    const goal = goalOf(id)
    return goal !== undefined && areaOf(goal) === options.area
  }

  const tasks = [...life.values()].filter((l) => l.type === 'task' && inArea(l.id))
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

  const byArea = new Map<
    string,
    {
      goals: number
      share: number
      was: number
      achievedGoals: string[]
      idleGoals: string[]
      goalRows: Array<{ title: string; share: number; gained: number }>
    }
  >()
  for (const g of end.nodes.filter((n) => n.type === 'goal')) {
    const key = areaOf(g.id)
    const row = byArea.get(key) ?? {
      goals: 0,
      share: 0,
      was: 0,
      achievedGoals: [],
      idleGoals: [],
      goalRows: [],
    }
    const before = start.get(g.id)?.progress ?? 0
    const progress = g.progress ?? 0
    row.goals++
    row.goalRows.push({
      title: g.title,
      share: Math.round(progress * 100) / 100,
      gained: Math.round((progress - before) * 100),
    })
    row.share += progress
    row.was += before
    if (g.status === 'done' && start.get(g.id)?.status !== 'done') row.achievedGoals.push(g.title)
    if (g.status === 'progress' && progress - before === 0) row.idleGoals.push(g.title)
    byArea.set(key, row)
  }
  const areas = [...byArea]
    .map(([area, r]) => ({
      area,
      goals: r.goals,
      share: Math.round((r.share / r.goals) * 100) / 100,
      gained: Math.round(((r.share - r.was) / r.goals) * 100),
      achieved: r.achievedGoals.length,
      idle: r.idleGoals.length,
      achievedGoals: r.achievedGoals,
      idleGoals: r.idleGoals,
      goalRows: r.goalRows,
    }))
    .sort((a, b) => a.area.localeCompare(b.area))

  const projects = end.nodes
    .filter((n) => n.type === 'project' && inArea(n.id))
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

  const heatFrom = weekStart(from)
  const counts = new Map<string, number>()
  for (const c of history.log) {
    const d = dayOf(c.date)
    if (d >= heatFrom && d <= to) counts.set(d, (counts.get(d) ?? 0) + 1)
  }

  const freshness = { fresh: 0, drifting: 0, stale: 0, notTracked: 0 }
  for (const [path, f] of options.freshness ?? []) {
    const type = repo.index.get(path)?.type
    if (type !== 'doc' && type !== 'runbook') continue
    if (f.state === 'fresh') freshness.fresh++
    else if (f.state === 'drifting') freshness.drifting++
    else if (f.state === 'stale') freshness.stale++
    else freshness.notTracked++
  }
  const decisions: Record<string, number> = {}
  const decided: Record<string, number> = {}
  const decisionKinds = ['proposed', 'accepted', 'deprecated', 'superseded'] as const
  for (const item of repo.index.items()) {
    if (item.type !== 'adr' || item.id === undefined) continue
    for (const e of life.get(item.id)?.events ?? []) {
      const kind = decisionKinds.find((k) => k === e.kind)
      if (kind !== undefined && inside(e.date, from, to)) decided[kind] = (decided[kind] ?? 0) + 1
    }
  }
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
      staleDocs: { value: freshness.stale },
      ...(options.linkage === undefined
        ? {}
        : {
            linked: {
              total: options.linkage.current.total,
              percent: percentOf(options.linkage.current),
              ...(options.linkage.previous.total === 0
                ? {}
                : { previous: percentOf(options.linkage.previous) }),
            },
          }),
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
    knowledge: { freshness, decisions, decided, undocumented: options.undocumented ?? [] },
    areaNames: [...byArea.keys()].sort(),
    approximate: history.partial,
  }
}
