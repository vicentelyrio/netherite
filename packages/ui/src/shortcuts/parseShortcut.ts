import type { Combo } from './shortcuts.types'

export const parseShortcut = (shortcut: string): Combo => {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .filter((p) => p !== '')
  const key = parts.at(-1)
  if (key === undefined) throw new Error(`Empty shortcut: "${shortcut}"`)
  const modifiers = new Set(parts.slice(0, -1))
  for (const m of modifiers) {
    if (m !== 'mod' && m !== 'shift' && m !== 'alt')
      throw new Error(`Unknown modifier "${m}" in "${shortcut}"`)
  }
  return {
    mod: modifiers.has('mod'),
    shift: modifiers.has('shift'),
    alt: modifiers.has('alt'),
    key,
  }
}
