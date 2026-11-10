import { isMacPlatform } from './isMacPlatform'
import { parseShortcut, stepsOf } from './parseShortcut'

const keyNames: Record<string, string> = {
  enter: '↵',
  escape: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  space: 'Space',
  plus: '+',
}

const formatStep = (step: string, mac: boolean) => {
  const combo = parseShortcut(step)
  const key = keyNames[combo.key] ?? combo.key.toUpperCase()
  if (mac) return `${combo.alt ? '⌥' : ''}${combo.shift ? '⇧' : ''}${combo.mod ? '⌘' : ''}${key}`
  return [combo.mod ? 'Ctrl' : '', combo.alt ? 'Alt' : '', combo.shift ? 'Shift' : '', key]
    .filter(Boolean)
    .join('+')
}

export const formatShortcut = (shortcut: string, mac = isMacPlatform()) =>
  stepsOf(shortcut)
    .map((step) => formatStep(step, mac))
    .join(' ')
