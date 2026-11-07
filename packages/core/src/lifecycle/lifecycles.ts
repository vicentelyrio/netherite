import { ItemType } from '@netherite/schema'
import type { History, ItemHistory } from '../history'
import type { Lifecycle, LifecycleOptions } from './lifecycle.types'
import { oneLifecycle } from './oneLifecycle'

const earliest = (dates: ReadonlyArray<string | undefined>) =>
  dates.reduce<string | undefined>(
    (a, b) => (b === undefined ? a : a === undefined || Date.parse(b) < Date.parse(a) ? b : a),
    undefined,
  )

const lastList = (item: ItemHistory, field: string): ReadonlyArray<string> => {
  const last = item.transitions.filter((t) => t.field === field).at(-1)?.to
  if (Array.isArray(last)) return last as ReadonlyArray<string>
  return typeof last === 'string' ? [last] : []
}

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
    if (item.type === ItemType.Task) for (const p of lastList(item, 'project')) add(p, own.started)
  }
  const withStart = (id: string, own: Lifecycle): Lifecycle => {
    const start = earliest(startedBy.get(id) ?? []) ?? own.started
    return start === own.started
      ? own
      : { ...own, ...(start === undefined ? {} : { started: start }) }
  }
  for (const [id, own] of result)
    if (own.type === ItemType.Project) result.set(id, withStart(id, own))
  for (const item of history.items.values()) {
    const own = result.get(item.id)
    if (own === undefined || item.type !== ItemType.Project) continue
    for (const g of lastList(item, 'goals')) add(g, own.started)
  }
  for (const [id, own] of result) if (own.type === ItemType.Goal) result.set(id, withStart(id, own))
  return result
}
