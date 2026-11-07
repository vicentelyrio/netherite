import type { ActionId } from './actions'
import type { ShortcutOptions } from './shortcuts.types'
import { useResolvedShortcuts } from './useResolvedShortcuts'
import { useShortcuts } from './useShortcuts'

export const useActionShortcuts = (
  handlers: Readonly<Partial<Record<ActionId, () => void>>>,
  options: ShortcutOptions = {},
): void => {
  const resolved = useResolvedShortcuts()
  const bindings: Record<string, () => void> = {}
  for (const [id, run] of Object.entries(handlers) as Array<[ActionId, () => void]>) {
    const { keys, aliases } = resolved[id]
    for (const key of keys === null ? aliases : [keys, ...aliases]) bindings[key] = run
  }
  useShortcuts(bindings, options)
}
