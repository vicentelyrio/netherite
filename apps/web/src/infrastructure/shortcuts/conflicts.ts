import { type ActionId, actionIds, actions, type ShortcutScope } from './actions'
import { normalise, stepsOf } from './parseShortcut'
import { resolveAll } from './resolve'
import type { ResolvedShortcut, ShortcutOverrides } from './shortcuts.types'

const overlap = (a: ShortcutScope, b: ShortcutScope) => a === b || a === 'global' || b === 'global'

const startsWith = (longer: string, shorter: string) => {
  const steps = stepsOf(longer)
  return steps.length > 1 && steps[0] === shorter
}

const clash = (a: string, b: string) => a === b || startsWith(a, b) || startsWith(b, a)

const keysOf = ({ keys, aliases }: ResolvedShortcut) =>
  (keys === null ? [...aliases] : [keys, ...aliases]).map(normalise)

export const conflicts = (
  overrides: ShortcutOverrides = {},
): ReadonlyArray<readonly [ActionId, ActionId]> => {
  const resolved = resolveAll(overrides)
  const seen: Array<readonly [string, ActionId]> = []
  const found: Array<readonly [ActionId, ActionId]> = []
  for (const id of actionIds) {
    for (const key of keysOf(resolved[id])) {
      for (const [taken, other] of seen) {
        if (other !== id && clash(taken, key) && overlap(actions[other].scope, actions[id].scope)) {
          found.push([other, id])
        }
      }
      seen.push([key, id])
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
      keysOf(resolved[other]).some((key) => clash(key, wanted)),
  )
}
