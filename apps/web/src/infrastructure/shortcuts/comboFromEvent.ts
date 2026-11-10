import { eventKey, isSymbolKey } from './eventKey'
import { isMacPlatform } from './isMacPlatform'
import { isModifierKey } from './isModifierKey'

export const comboFromEvent = (
  event: Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
  mac = isMacPlatform(),
): string | undefined => {
  const key = eventKey(event)
  if (isModifierKey(key)) return undefined
  if (mac ? event.ctrlKey : event.metaKey) return undefined
  const mod = mac ? event.metaKey : event.ctrlKey
  const shift = event.shiftKey && !isSymbolKey(key)
  return `${mod ? 'mod+' : ''}${event.altKey ? 'alt+' : ''}${shift ? 'shift+' : ''}${key}`
}
