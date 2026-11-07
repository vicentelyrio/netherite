import { type ActionDefinition, type ActionId, actionIds, actions } from './actions'
import { isValidShortcut } from './parseShortcut'
import type { ResolvedShortcut, ShortcutOverrides } from './shortcuts.types'

export const resolveShortcut = (
  id: ActionId,
  overrides: ShortcutOverrides = {},
): ResolvedShortcut => {
  const own = overrides[id]
  if (own === null) return { keys: null, aliases: [] }
  if (own !== undefined && isValidShortcut(own)) return { keys: own, aliases: [] }
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
