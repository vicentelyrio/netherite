import { useMemo } from 'react'
import { useSettings } from '../settings'
import type { ActionId } from './actions'
import { resolveAll } from './resolve'
import type { ResolvedShortcut } from './shortcuts.types'

export const useResolvedShortcuts = (): Readonly<Record<ActionId, ResolvedShortcut>> => {
  const { settings } = useSettings()
  return useMemo(() => resolveAll(settings.shortcuts), [settings.shortcuts])
}
