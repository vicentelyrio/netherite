import { useEffect, useRef } from 'react'
import { dispatcher, type ShortcutHandler } from './dispatcher'
import { isMacPlatform } from './isMacPlatform'
import type { ShortcutOptions } from './shortcuts.types'

export function useShortcuts(
  bindings: Readonly<Record<string, ShortcutHandler>>,
  options: ShortcutOptions = {},
) {
  const latest = useRef(bindings)
  latest.current = bindings
  const enabled = options.enabled ?? true
  const layer = options.layer ?? 'app'
  const { mac, scope } = options

  useEffect(() => {
    if (!enabled) return
    return dispatcher.register({
      layer,
      ...(scope === undefined ? {} : { scope }),
      mac: mac ?? isMacPlatform(),
      bindings: () => latest.current,
    })
  }, [enabled, mac, layer, scope])
}
