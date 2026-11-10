import { type ActionDefinition, type ActionId, actionIds, actions } from './actions'
import { isValidShortcut, stepsOf } from './parseShortcut'
import type { ResolvedShortcut, ShortcutOverrides } from './shortcuts.types'

const singleStepScope = 'editor'

const usable = (id: ActionId, keys: string) =>
  isValidShortcut(keys) && (actions[id].scope !== singleStepScope || stepsOf(keys).length === 1)

export const resolveShortcut = (
  id: ActionId,
  overrides: ShortcutOverrides = {},
): ResolvedShortcut => {
  const own = overrides[id]
  if (own === null) return { keys: null, aliases: [] }
  if (own !== undefined && usable(id, own)) return { keys: own, aliases: [] }
  const base: ActionDefinition = actions[id]
  return { keys: base.keys, aliases: base.aliases ?? [] }
}

export const resolveAll = (
  overrides: ShortcutOverrides = {},
): Readonly<Record<ActionId, ResolvedShortcut>> =>
  Object.fromEntries(actionIds.map((id) => [id, resolveShortcut(id, overrides)])) as Record<
    ActionId,
    ResolvedShortcut
  >
