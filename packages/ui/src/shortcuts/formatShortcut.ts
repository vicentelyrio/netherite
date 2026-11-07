import { isMacPlatform } from './isMacPlatform'
import { parseShortcut } from './parseShortcut'

const keyNames: Record<string, string> = {
  enter: '↵',
  escape: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  ' ': 'Space',
}

export const formatShortcut = (shortcut: string, mac = isMacPlatform()) => {
  const combo = parseShortcut(shortcut)
  const key = keyNames[combo.key] ?? combo.key.toUpperCase()
  if (mac) return `${combo.alt ? '⌥' : ''}${combo.shift ? '⇧' : ''}${combo.mod ? '⌘' : ''}${key}`
  return [combo.mod ? 'Ctrl' : '', combo.alt ? 'Alt' : '', combo.shift ? 'Shift' : '', key]
    .filter(Boolean)
    .join('+')
}
