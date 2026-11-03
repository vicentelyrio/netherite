import type { StateCategory } from '@netherite/schema'
import type { FieldValue, History, ItemHistory, Transition } from './history'

/** Where an item stands in its life, whatever its type calls it. */
export type Phase = StateCategory

export type LifecycleKind =
  | 'created'
  | 'started'
  | 'held'
  | 'resumed'
  | 'finished'
  | 'reopened'
  | 'rescheduled'
  | 'proposed'
  | 'accepted'
  | 'deprecated'
  | 'superseded'

export interface LifecycleEvent {
  readonly kind: LifecycleKind
  /** Commit date, ISO 8601. */
  readonly date: string
  readonly hash: string
  /** The value before and after, for `rescheduled` the due dates. */
  readonly from?: string
  readonly to?: string
  /** `true` when the date is only the first time the history window shows the item. */
  readonly approximate: boolean
}

/** A stretch of time an item spent in one phase. `to` is missing while it is still there. */
export interface Span {
  readonly phase: Phase
  readonly from: string
  readonly to?: string
}

export interface Lifecycle {
  readonly id: string
  readonly type: string | undefined
  readonly events: ReadonlyArray<LifecycleEvent>
  readonly spans: ReadonlyArray<Span>
  /** When the item came to exist. */
  readonly created?: string
  /** When work first began; for projects and goals, when their first task or project did. */
  readonly started?: string
  /** When it last became done (or an ADR was accepted); missing while it is open. */
  readonly finished?: string
  /** When an ADR was deprecated or superseded. */
  readonly ended?: string
  /** Days spent blocked or paused, up to `now` for a stretch that is still going. */
  readonly waitingDays: number
  /** The `due` date now, and how many times it moved. */
  readonly due?: string
  readonly rescheduled: number
  /** `true` when some dates are only as early as the available history goes. */
  readonly approximate: boolean
}

export interface LifecycleOptions {
  /** Task states and their categories, from the config. */
  readonly states: ReadonlyArray<{ readonly name: string; readonly category: StateCategory }>
  /** The moment open stretches end at (ISO 8601). Default: the current time. */
  readonly now?: string
}

const text = (value: FieldValue): string | undefined =>
  typeof value === 'string' ? value : undefined

const phaseOf = (
  type: string | undefined,
  value: string | undefined,
  states: LifecycleOptions['states'],
): Phase | undefined => {
  if (value === undefined) return undefined
  switch (type) {
    case 'task':
      return states.find((s) => s.name === value)?.category ?? 'todo'
    case 'project':
      return value === 'paused' ? 'blocked' : value === 'active' ? 'active' : 'done'
    case 'goal':
      return value === 'active' ? 'active' : 'done'
    default:
      return undefined
  }
}

const dayMs = 86_400_000
const daysBetween = (from: string, to: string) =>
  Math.max(0, (Date.parse(to) - Date.parse(from)) / dayMs)

const adrKinds: Record<string, LifecycleKind> = {
  proposed: 'proposed',
  accepted: 'accepted',
  deprecated: 'deprecated',
  superseded: 'superseded',
}

const earliest = (dates: ReadonlyArray<string | undefined>) =>
  dates.reduce<string | undefined>(
    (a, b) => (b === undefined ? a : a === undefined || Date.parse(b) < Date.parse(a) ? b : a),
    undefined,
  )

const oneLifecycle = (
  item: ItemHistory,
  partial: boolean,
  options: LifecycleOptions,
  now: string,
): Lifecycle => {
  const events: LifecycleEvent[] = []
  const spans: Array<{ phase: Phase; from: string; to?: string }> = []
  const push = (kind: LifecycleKind, t: Transition, from?: string, to?: string) =>
    events.push({
      kind,
      date: t.date,
      hash: t.hash,
      ...(from === undefined ? {} : { from }),
      ...(to === undefined ? {} : { to }),
      approximate: t.kind === 'seen',
    })

  const primary = item.type === 'task' ? 'state' : 'status'
  const own = item.transitions.filter((t) => t.field === primary)
  let phase: Phase | undefined
  let started: string | undefined
  let finished: string | undefined
  let ended: string | undefined

  for (const t of own) {
    if (item.type === 'adr') {
      const kind = adrKinds[text(t.to) ?? '']
      if (kind === undefined) continue
      push(kind, t)
      if (kind === 'proposed') started ??= item.created?.date ?? t.date
      if (kind === 'accepted') finished = t.date
      if (kind === 'deprecated' || kind === 'superseded') ended = t.date
      continue
    }
    const next = phaseOf(item.type, text(t.to), options.states)
    if (next === undefined) continue
    const last = spans.at(-1)
    if (last !== undefined) last.to = t.date
    spans.push({ phase: next, from: t.date })

    if (phase === undefined) {
      push('created', t)
    } else if (next === 'active') {
      if (phase === 'blocked') push('resumed', t)
      else if (phase === 'done') push('reopened', t)
      else push(started === undefined ? 'started' : 'resumed', t)
    } else if (next === 'todo' && phase === 'done') {
      push('reopened', t)
    }
    if (phase === undefined && next === 'active') push('started', t)
    if (next === 'active') started ??= t.date
    if (next === 'blocked' && phase !== 'blocked') push('held', t)
    if (next === 'done' && phase !== 'done') {
      push('finished', t)
      finished = t.date
    }
    if (next !== 'done') finished = undefined
    phase = next
  }

  // Due dates that moved. The first value is where it started, not a move.
  let due: string | undefined
  let rescheduled = 0
  for (const t of item.transitions) {
    if (t.field !== 'due') continue
    const to = text(t.to)
    const from = text(t.from)
    if (from !== undefined && to !== undefined) {
      rescheduled++
      push('rescheduled', t, from, to)
    }
    due = to
  }

  events.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  const waitingDays = spans
    .filter((s) => s.phase === 'blocked')
    .reduce((sum, s) => sum + daysBetween(s.from, s.to ?? now), 0)

  const created = item.created?.date ?? own[0]?.date
  const approximate =
    item.transitions.some((t) => t.kind === 'seen') || (partial && item.created === undefined)

  return {
    id: item.id,
    type: item.type,
    events,
    spans,
    ...(created === undefined ? {} : { created }),
    ...(started === undefined ? {} : { started }),
    ...(finished === undefined ? {} : { finished }),
    ...(ended === undefined ? {} : { ended }),
    waitingDays: Math.round(waitingDays * 10) / 10,
    ...(due === undefined ? {} : { due }),
    rescheduled,
    approximate,
  }
}

const lastList = (item: ItemHistory, field: string): ReadonlyArray<string> => {
  const last = item.transitions.filter((t) => t.field === field).at(-1)?.to
  if (Array.isArray(last)) return last as ReadonlyArray<string>
  return typeof last === 'string' ? [last] : []
}

/**
 * The life of every item, read from its history (ADR-00020): when it was created, started,
 * held, finished or reopened, how long it waited, and how often its due date moved. Nothing is
 * stored; the same history always gives the same answer. A project starts when its first task
 * does, and a goal when its first project does.
 */
export const lifecycles = (
  history: History,
  options: LifecycleOptions,
): ReadonlyMap<string, Lifecycle> => {
  const now = options.now ?? new Date().toISOString()
  const result = new Map<string, Lifecycle>()
  for (const item of history.items.values()) {
    if (item.deletedAt !== undefined) continue
    result.set(item.id, oneLifecycle(item, history.partial, options, now))
  }

  const startedBy = new Map<string, string[]>()
  const add = (parent: string, date: string | undefined) => {
    if (date === undefined) return
    const list = startedBy.get(parent) ?? []
    list.push(date)
    startedBy.set(parent, list)
  }
  for (const item of history.items.values()) {
    const own = result.get(item.id)
    if (own === undefined) continue
    if (item.type === 'task') for (const p of lastList(item, 'project')) add(p, own.started)
  }
  const withStart = (id: string, own: Lifecycle): Lifecycle => {
    // Work on the children is when it began; with none yet, the item's own first active day.
    const start = earliest(startedBy.get(id) ?? []) ?? own.started
    return start === own.started
      ? own
      : { ...own, ...(start === undefined ? {} : { started: start }) }
  }
  for (const [id, own] of result) if (own.type === 'project') result.set(id, withStart(id, own))
  for (const item of history.items.values()) {
    const own = result.get(item.id)
    if (own === undefined || item.type !== 'project') continue
    for (const g of lastList(item, 'goals')) add(g, own.started)
  }
  for (const [id, own] of result) if (own.type === 'goal') result.set(id, withStart(id, own))
  return result
}
