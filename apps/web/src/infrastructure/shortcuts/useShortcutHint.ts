import type { ActionId } from './actions'
import { formatShortcut } from './formatShortcut'
import { useResolvedShortcuts } from './useResolvedShortcuts'

export const useShortcutHint = (id: ActionId): string | undefined => {
  const keys = useResolvedShortcuts()[id].keys
  return keys === null ? undefined : formatShortcut(keys)
}
