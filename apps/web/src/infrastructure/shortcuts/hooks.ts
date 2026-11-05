import { formatShortcut, useShortcuts } from '@netherite/ui'
import { useMemo } from 'react'
import { useSettings } from '../settings'
import type { ActionId } from './actions'
import { type ResolvedShortcut, resolveAll } from './shortcuts'

/** The keys of every action, with the person's choices applied. */
export const useResolvedShortcuts = (): Readonly<Record<ActionId, ResolvedShortcut>> => {
  const { settings } = useSettings()
  return useMemo(() => resolveAll(settings.shortcuts), [settings.shortcuts])
}

/** How to show an action's keys for this platform: `⇧⌘G` or `Ctrl+Shift+G`. */
export const useShortcutHint = (id: ActionId): string =>
  formatShortcut(useResolvedShortcuts()[id].keys)

/**
 * Runs a handler per action when its keys are pressed anywhere on the page. Which keys that is
 * comes from the settings, so a handler never names a key.
 */
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
