import { parseShortcut } from '@netherite/ui'
import { type ActionId, actionIds, actions } from './actions'

export interface ResolvedShortcut {
  /** The main keys, shown in tooltips and menus. */
  readonly keys: string
  /** More keys that do the same. */
  readonly aliases: ReadonlyArray<string>
}

/** Is this text a shortcut the app can listen for (`mod+shift+g`)? */
export const isValidShortcut = (value: string): boolean => {
  try {
    parseShortcut(value)
    return true
  } catch {
    return false
  }
}

/** The keys an action uses: the person's own if valid, otherwise the default. */
export const resolveShortcut = (
  id: ActionId,
  overrides: Readonly<Partial<Record<ActionId, string>>> = {},
): ResolvedShortcut => {
  const own = overrides[id]
  if (own !== undefined && isValidShortcut(own)) return { keys: own, aliases: [] }
  const base: { readonly keys: string; readonly aliases?: ReadonlyArray<string> } = actions[id]
  return { keys: base.keys, aliases: base.aliases ?? [] }
}

export const resolveAll = (
  overrides: Readonly<Partial<Record<ActionId, string>>> = {},
): Readonly<Record<ActionId, ResolvedShortcut>> =>
  Object.fromEntries(actionIds.map((id) => [id, resolveShortcut(id, overrides)])) as Record<
    ActionId,
    ResolvedShortcut
  >

const normalise = (shortcut: string) => {
  const c = parseShortcut(shortcut)
  return `${c.mod ? 'mod+' : ''}${c.alt ? 'alt+' : ''}${c.shift ? 'shift+' : ''}${c.key}`
}

/** Pairs of actions that would answer to the same keys. */
export const conflicts = (
  overrides: Readonly<Partial<Record<ActionId, string>>> = {},
): ReadonlyArray<readonly [ActionId, ActionId]> => {
  const resolved = resolveAll(overrides)
  const owners = new Map<string, ActionId>()
  const found: Array<readonly [ActionId, ActionId]> = []
  for (const id of actionIds) {
    for (const keys of [resolved[id].keys, ...resolved[id].aliases]) {
      const key = normalise(keys)
      const other = owners.get(key)
      if (other !== undefined && other !== id) found.push([other, id])
      else owners.set(key, id)
    }
  }
  return found
}
