import { useSettings } from '../settings'
import { type ActionDefinition, type ActionId, actions } from './actions'
import { normalise } from './parseShortcut'
import type { ShortcutOverrides } from './shortcuts.types'

const without = (shortcuts: ShortcutOverrides, id: ActionId): ShortcutOverrides => {
  const { [id]: _gone, ...rest } = shortcuts
  return rest
}

const withKeys = (shortcuts: ShortcutOverrides, id: ActionId, keys: string): ShortcutOverrides => {
  const base: ActionDefinition = actions[id]
  return normalise(base.keys) === normalise(keys)
    ? without(shortcuts, id)
    : { ...shortcuts, [id]: keys }
}

export const useShortcutSettings = () => {
  const { settings, update } = useSettings()
  const change = (next: (shortcuts: ShortcutOverrides) => ShortcutOverrides) =>
    update((s) => ({ ...s, shortcuts: next(s.shortcuts) }))
  return {
    overrides: settings.shortcuts,
    isCustom: (id: ActionId) => settings.shortcuts[id] !== undefined,
    bind: (id: ActionId, keys: string) => change((s) => withKeys(s, id, keys)),
    replace: (id: ActionId, keys: string, others: ReadonlyArray<ActionId>) =>
      change((s) =>
        withKeys({ ...s, ...Object.fromEntries(others.map((o) => [o, null])) }, id, keys),
      ),
    clear: (id: ActionId) => change((s) => ({ ...s, [id]: null })),
    reset: (id: ActionId) => change((s) => without(s, id)),
    resetAll: () => change(() => ({})),
  }
}
