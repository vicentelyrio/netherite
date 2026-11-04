import { defaultTrackedFields, type FieldValue, type History, type Transition } from './history'
import { fieldsOf } from './views'
import type { WorkspaceIndex } from './workspace-index'

const asValue = (value: unknown): FieldValue => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return undefined
}

const same = (a: FieldValue, b: FieldValue) => JSON.stringify(a) === JSON.stringify(b)

/**
 * History is what was committed, but Netherite never commits for you: an ADR accepted in the app
 * or a task ticked off by an agent is in the file long before it is in git. This puts those
 * changes on the end of the history, dated `now`, so the views that read history (Timeline,
 * Stats, the as-of graph) show the work as it stands. A change that is committed later replaces
 * its stand-in with the real commit and date. Items with no history yet are left to the views
 * that already treat a new file as starting now.
 */
export const withWorkingTree = (
  history: History,
  index: WorkspaceIndex,
  now: string,
  tracked: ReadonlyArray<string> = defaultTrackedFields,
): History => {
  const items = new Map(history.items)
  for (const item of index.items()) {
    if (item.id === undefined) continue
    const past = items.get(item.id)
    if (past === undefined) continue
    const fields = fieldsOf(item)
    const added: Transition[] = []
    for (const field of tracked) {
      const current = asValue(fields[field])
      if (current === undefined) continue
      const before = [...past.transitions].reverse().find((t) => t.field === field)?.to
      if (same(before, current)) continue
      added.push({
        id: item.id,
        type: past.type,
        field,
        from: before,
        to: current,
        kind: 'changed',
        hash: 'working-tree',
        date: now,
        author: { name: 'working tree', email: '' },
      })
    }
    if (added.length > 0)
      items.set(item.id, { ...past, transitions: [...past.transitions, ...added] })
  }
  return items.size === history.items.size &&
    [...items].every(([id, h]) => history.items.get(id) === h)
    ? history
    : { ...history, items }
}
