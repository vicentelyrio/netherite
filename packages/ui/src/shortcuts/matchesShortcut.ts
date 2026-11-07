import { isMacPlatform } from './isMacPlatform'
import type { Combo } from './shortcuts.types'

type KeyEventLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>

export const matchesShortcut = (event: KeyEventLike, combo: Combo, mac = isMacPlatform()) => {
  const mod = mac ? event.metaKey : event.ctrlKey
  const stray = mac ? event.ctrlKey : event.metaKey
  return (
    event.key.toLowerCase() === combo.key &&
    mod === combo.mod &&
    !stray &&
    event.shiftKey === combo.shift &&
    event.altKey === combo.alt
  )
}
