import { parseShortcut } from './parseShortcut'

export const toCodeMirrorKey = (keys: string) => {
  const c = parseShortcut(keys)
  const key = c.key === 'space' ? 'Space' : c.key === 'plus' ? '+' : c.key
  return `${c.mod ? 'Mod-' : ''}${c.alt ? 'Alt-' : ''}${c.shift ? 'Shift-' : ''}${key}`
}
