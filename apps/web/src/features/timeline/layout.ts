import type { Timeline as TimelineSchema } from '@netherite/api'

export type Timeline = typeof TimelineSchema.Type
export type TimelineGoal = Timeline['goals'][number]
export type TimelineProject = Timeline['projects'][number]
export type TimelineTask = Timeline['tasks'][number]
export type TimelineDecision = Timeline['decisions'][number]

/** `fit` sizes the window to the dates there are; the others are a fixed length. */
export type Zoom = 'fit' | 'quarter' | 'year' | 'two-years'

export const zooms: ReadonlyArray<Zoom> = ['fit', 'quarter', 'year', 'two-years']

const zoomDays = { quarter: 90, year: 365, 'two-years': 730 } as const

const DAY = 86_400_000
const at = (day: string) => Date.parse(`${day}T00:00:00Z`)

export const addDays = (day: string, days: number) =>
  new Date(at(day) + days * DAY).toISOString().slice(0, 10)

export const daysBetween = (from: string, to: string) => Math.round((at(to) - at(from)) / DAY)

/** The days shown for a zoom: mostly the past, with some room ahead for due dates. */
export const windowFor = (zoom: Exclude<Zoom, 'fit'>, today: string) => {
  const length = zoomDays[zoom]
  return {
    from: addDays(today, -Math.round(length * 0.6)),
    to: addDays(today, Math.round(length * 0.4)),
  }
}

/** From a day before the first date to a little past today or the last due date. */
export const fitWindow = (range: { from: string; to: string; today: string }) => {
  const end = [range.to, range.today].sort().at(-1) as string
  const span = Math.max(1, daysBetween(range.from, end))
  return { from: addDays(range.from, -1), to: addDays(end, Math.max(2, Math.round(span * 0.08))) }
}

export type TickUnit = 'day' | 'week' | 'month' | 'quarter'

/** How far apart gridlines are: by the zoom, or for `fit` by how many days are shown. */
export const unitOf = (zoom: Zoom, from: string, to: string): TickUnit => {
  if (zoom === 'quarter') return 'week'
  if (zoom === 'year') return 'month'
  if (zoom === 'two-years') return 'quarter'
  const span = daysBetween(from, to)
  return span <= 21 ? 'day' : span <= 120 ? 'week' : span <= 500 ? 'month' : 'quarter'
}

export interface Span {
  /** Percent from the left of the track. */
  readonly left: number
  /** Percent of the track's width. */
  readonly width: number
}

/** Where a stretch of days falls on a track that shows `from` to `to`, clipped to the track. */
export const spanOf = (start: string, end: string, from: string, to: string): Span | undefined => {
  const total = Math.max(1, daysBetween(from, to))
  const a = Math.max(0, daysBetween(from, start))
  const b = Math.min(total, daysBetween(from, end))
  if (b < 0 || a > total) return undefined
  return { left: (a / total) * 100, width: Math.max(0, ((b - a) / total) * 100) }
}

/** Where one day falls, in percent, or `undefined` outside the window. */
export const pointOf = (day: string, from: string, to: string): number | undefined => {
  const total = Math.max(1, daysBetween(from, to))
  const at = daysBetween(from, day)
  return at < 0 || at > total ? undefined : (at / total) * 100
}

export interface Tick {
  readonly day: string
  /** The first of a year, to be written larger. */
  readonly major: boolean
}

/** Gridlines: a week apart for a quarter, a month for a year, a quarter-year for two years. */
export const ticksOf = (zoom: Zoom, from: string, to: string): ReadonlyArray<Tick> => {
  const ticks: Tick[] = []
  const unit = unitOf(zoom, from, to)
  if (unit === 'day') {
    for (let day = from; day <= to; day = addDays(day, 1)) ticks.push({ day, major: false })
    return ticks
  }
  if (unit === 'week') {
    const d = new Date(`${from}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7))
    for (let day = d.toISOString().slice(0, 10); day <= to; day = addDays(day, 7)) {
      ticks.push({ day, major: false })
    }
    return ticks
  }
  const step = unit === 'month' ? 1 : 3
  const d = new Date(`${from.slice(0, 7)}-01T00:00:00Z`)
  if (d.getUTCMonth() % step !== 0) d.setUTCMonth(d.getUTCMonth() - (d.getUTCMonth() % step))
  for (; d.toISOString().slice(0, 10) <= to; d.setUTCMonth(d.getUTCMonth() + step)) {
    const day = d.toISOString().slice(0, 10)
    if (day >= from) ticks.push({ day, major: d.getUTCMonth() === 0 })
  }
  return ticks
}

export type Row =
  | { readonly kind: 'goal'; readonly item: TimelineGoal }
  | {
      readonly kind: 'project'
      readonly item: TimelineProject
      readonly tasks: number
      readonly done: number
      readonly decisions: ReadonlyArray<TimelineDecision>
      readonly expanded: boolean
    }
  | { readonly kind: 'task'; readonly item: TimelineTask }
  | { readonly kind: 'decision'; readonly item: TimelineDecision }

export interface RowOptions {
  readonly expanded: ReadonlySet<string>
  readonly showTasks: boolean
  readonly showDecisions: boolean
}

/**
 * The rows top to bottom: each goal with its projects, a project's tasks when it is open, then
 * projects that belong to no goal, then decisions.
 */
export const rowsOf = (timeline: Timeline, options: RowOptions): ReadonlyArray<Row> => {
  const rows: Row[] = []
  const project = (item: TimelineProject) => {
    const tasks = timeline.tasks.filter((t) => t.project === item.id)
    const expanded = options.showTasks && options.expanded.has(item.id)
    rows.push({
      kind: 'project',
      item,
      tasks: tasks.length,
      done: tasks.filter((t) => t.status === 'done').length,
      decisions: options.showDecisions ? decisionsOf(timeline, item.id) : [],
      expanded,
    })
    if (expanded) for (const t of tasks) rows.push({ kind: 'task', item: t })
  }
  const goalIds = new Set(timeline.goals.map((g) => g.id))
  for (const goal of timeline.goals) {
    rows.push({ kind: 'goal', item: goal })
    for (const p of timeline.projects.filter((x) => x.goal === goal.id)) project(p)
  }
  for (const p of timeline.projects.filter((x) => x.goal === undefined || !goalIds.has(x.goal))) {
    project(p)
  }
  // A decision of a project is drawn in that project's row; the rest stand on rows of their own.
  const projectIds = new Set(timeline.projects.map((p) => p.id))
  if (options.showDecisions)
    for (const item of timeline.decisions) {
      if (item.project === undefined || !projectIds.has(item.project)) {
        rows.push({ kind: 'decision', item })
      }
    }
  return rows
}

/** The decisions of a project, drawn above its bar. */
export const decisionsOf = (timeline: Timeline, projectId: string) =>
  timeline.decisions.filter((d) => d.project === projectId && d.proposed !== undefined)

export interface Piece {
  readonly kind: 'wait' | 'active' | 'planned' | 'hold' | 'overdue'
  readonly span: Span
}

/**
 * The bars of a goal, project or task on its own track: waiting from creation to the start, the
 * active stretch, holds over it, a planned outline when it has not started, and the part past
 * its due date.
 */
export const piecesOf = (
  item: {
    readonly created?: string | undefined
    readonly started?: string | undefined
    readonly finished?: string | undefined
    readonly due?: string | undefined
    readonly overdue: boolean
    readonly planned: boolean
    readonly holds: ReadonlyArray<{ readonly from: string; readonly to?: string | undefined }>
  },
  today: string,
  from: string,
  to: string,
  withWait: boolean,
): ReadonlyArray<Piece> => {
  const pieces: Piece[] = []
  const add = (kind: Piece['kind'], a: string, b: string) => {
    const span = spanOf(a, b, from, to)
    if (span !== undefined) pieces.push({ kind, span })
  }
  if (item.planned) {
    const start = item.created ?? today
    add('planned', start, item.due !== undefined && item.due > start ? item.due : today)
  } else if (item.started !== undefined) {
    if (withWait && item.created !== undefined && item.created < item.started) {
      add('wait', item.created, item.started)
    }
    const end = item.finished ?? today
    add('active', item.started, end)
    for (const hold of item.holds) add('hold', hold.from, hold.to ?? today)
    if (item.overdue && item.due !== undefined) add('overdue', item.due, today)
  }
  return pieces
}
