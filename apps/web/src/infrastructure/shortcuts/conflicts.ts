import { type ActionId, actionIds, actions, type ShortcutScope } from './actions'
import { normalise } from './parseShortcut'
import { resolveAll } from './resolve'
import type { ResolvedShortcut, ShortcutOverrides } from './shortcuts.types'

const overlap = (a: ShortcutScope, b: ShortcutScope) => a === b || a === 'global' || b === 'global'

const keysOf = ({ keys, aliases }: ResolvedShortcut) =>
  (keys === null ? [...aliases] : [keys, ...aliases]).map(normalise)

export const conflicts = (
  overrides: ShortcutOverrides = {},
): ReadonlyArray<readonly [ActionId, ActionId]> => {
  const resolved = resolveAll(overrides)
  const owners = new Map<string, ActionId[]>()
  const found: Array<readonly [ActionId, ActionId]> = []
  for (const id of actionIds) {
    for (const key of keysOf(resolved[id])) {
      const others = owners.get(key) ?? []
      for (const other of others) {
        if (other !== id && overlap(actions[other].scope, actions[id].scope)) {
          found.push([other, id])
        }
      }
      owners.set(key, [...others, id])
    }
  }
  return found
}

export const conflictsWith = (
  id: ActionId,
  keys: string,
  overrides: ShortcutOverrides = {},
): ReadonlyArray<ActionId> => {
  const wanted = normalise(keys)
  const resolved = resolveAll(overrides)
  return actionIds.filter(
    (other) =>
      other !== id &&
      overlap(actions[other].scope, actions[id].scope) &&
      keysOf(resolved[other]).includes(wanted),
  )
}
