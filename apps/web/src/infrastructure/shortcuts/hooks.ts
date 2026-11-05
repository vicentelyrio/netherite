import { formatShortcut, useShortcuts } from '@netherite/ui'
import { useMemo } from 'react'
import { useSettings } from '../settings'
import type { ActionId } from './actions'
import { type ResolvedShortcut, resolveAll } from './shortcuts'

export const useResolvedShortcuts = (): Readonly<Record<ActionId, ResolvedShortcut>> => {
  const { settings } = useSettings()
  return useMemo(() => resolveAll(settings.shortcuts), [settings.shortcuts])
}

export const useShortcutHint = (id: ActionId): string =>
  formatShortcut(useResolvedShortcuts()[id].keys)

export const useActionShortcuts = (
  handlers: Readonly<Partial<Record<ActionId, () => void>>>,
  options: { readonly enabled?: boolean; readonly mac?: boolean } = {},
): void => {
  const resolved = useResolvedShortcuts()
  const bindings: Record<string, () => void> = {}
  for (const [id, run] of Object.entries(handlers) as Array<[ActionId, () => void]>) {
    for (const keys of [resolved[id].keys, ...resolved[id].aliases]) bindings[keys] = run
  }
  useShortcuts(bindings, options)
}
