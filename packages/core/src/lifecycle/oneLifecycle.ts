import { ItemType, StateCategoryName } from '@netherite/schema'
import type { FieldValue, ItemHistory, Transition } from '../history'
import type {
  Lifecycle,
  LifecycleEvent,
  LifecycleKind,
  LifecycleOptions,
  Phase,
} from './lifecycle.types'
import { phaseOf } from './phaseOf'

const text = (value: FieldValue): string | undefined =>
  typeof value === 'string' ? value : undefined

const dayMs = 86_400_000

const daysBetween = (from: string, to: string) =>
  Math.max(0, (Date.parse(to) - Date.parse(from)) / dayMs)

const adrKinds: Record<string, LifecycleKind> = {
  proposed: 'proposed',
  accepted: 'accepted',
  deprecated: 'deprecated',
  superseded: 'superseded',
}

export const oneLifecycle = (
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

  const primary = item.type === ItemType.Task ? 'state' : 'status'
  const own = item.transitions.filter((t) => t.field === primary)
  let phase: Phase | undefined
  let started: string | undefined
  let finished: string | undefined
  let ended: string | undefined

  for (const t of own) {
    if (item.type === ItemType.Adr) {
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
    } else if (next === StateCategoryName.Active) {
      if (phase === StateCategoryName.Blocked) push('resumed', t)
      else if (phase === StateCategoryName.Done) push('reopened', t)
      else push(started === undefined ? 'started' : 'resumed', t)
    } else if (next === StateCategoryName.Todo && phase === StateCategoryName.Done) {
      push('reopened', t)
    }
    if (phase === undefined && next === StateCategoryName.Active) push('started', t)
    if (next === StateCategoryName.Active) started ??= t.date
    if (next === StateCategoryName.Blocked && phase !== StateCategoryName.Blocked) push('held', t)
    if (next === StateCategoryName.Done && phase !== StateCategoryName.Done) {
      push('finished', t)
      finished = t.date
    }
    if (next !== StateCategoryName.Done) finished = undefined
    phase = next
  }

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
    .filter((s) => s.phase === StateCategoryName.Blocked)
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
