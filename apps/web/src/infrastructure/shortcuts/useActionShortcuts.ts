import { type ActionId, actions, type ShortcutScope, scopeLayers } from './actions'
import type { ShortcutHandler } from './dispatcher'
import type { ShortcutOptions } from './shortcuts.types'
import { useResolvedShortcuts } from './useResolvedShortcuts'
import { useShortcuts } from './useShortcuts'

const defaultScope: ShortcutScope = 'global'

export const useActionShortcuts = (
  handlers: Readonly<Partial<Record<ActionId, ShortcutHandler>>>,
  options: Pick<ShortcutOptions, 'enabled' | 'mac'> = {},
): void => {
  const resolved = useResolvedShortcuts()
  const entries = Object.entries(handlers) as Array<[ActionId, ShortcutHandler]>
  const bindings: Record<string, ShortcutHandler> = {}
  for (const [id, run] of entries) {
    const { keys, aliases } = resolved[id]
    for (const key of keys === null ? aliases : [keys, ...aliases]) bindings[key] = run
  }
  const [first] = entries
  const scope: ShortcutScope = first === undefined ? defaultScope : actions[first[0]].scope
  useShortcuts(bindings, { ...options, scope, layer: scopeLayers[scope] })
}
