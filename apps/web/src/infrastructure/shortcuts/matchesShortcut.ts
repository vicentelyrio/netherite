import { eventKey, isSymbolKey } from './eventKey'
import { isMacPlatform } from './isMacPlatform'
import type { Combo } from './shortcuts.types'

type KeyEventLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'> &
  Partial<Pick<KeyboardEvent, 'code'>>

export const matchesShortcut = (event: KeyEventLike, combo: Combo, mac = isMacPlatform()) => {
  const mod = mac ? event.metaKey : event.ctrlKey
  const stray = mac ? event.ctrlKey : event.metaKey
  // A symbol such as / or ? needs Shift on some layouts and not on others: the character decides.
  const shift = isSymbolKey(combo.key) ? true : event.shiftKey === combo.shift
  return (
    eventKey({ key: event.key, code: event.code ?? '', altKey: event.altKey }) === combo.key &&
    mod === combo.mod &&
    !stray &&
    shift &&
    event.altKey === combo.alt
  )
}
