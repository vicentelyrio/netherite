import { defaultTrackedFields, type FieldValue, type History, type Transition } from '../history'
import { fieldsOf } from '../views'
import type { WorkspaceIndex } from '../workspace-index'

const asValue = (value: unknown): FieldValue => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return undefined
}

const same = (a: FieldValue, b: FieldValue) => JSON.stringify(a) === JSON.stringify(b)

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
