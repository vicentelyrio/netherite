import { useEffect, useRef } from 'react'
import { isEditable } from './isEditable'
import { isMacPlatform } from './isMacPlatform'
import { matchesShortcut } from './matchesShortcut'
import { parseShortcut } from './parseShortcut'
import type { ShortcutOptions } from './shortcuts.types'

export function useShortcuts(
  bindings: Readonly<Record<string, () => void>>,
  options: ShortcutOptions = {},
) {
  const latest = useRef(bindings)
  latest.current = bindings
  const enabled = options.enabled ?? true

  useEffect(() => {
    if (!enabled) return
    const mac = options.mac ?? isMacPlatform()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return
      for (const [shortcut, handler] of Object.entries(latest.current)) {
        const combo = parseShortcut(shortcut)
        if (!combo.mod && isEditable(event.target)) continue
        if (matchesShortcut(event, combo, mac)) {
          event.preventDefault()
          handler()
          return
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, options.mac])
}
