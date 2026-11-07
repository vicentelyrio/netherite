import { normalise } from './parseShortcut'

const browserKeeps = new Set([
  'mod+t',
  'mod+n',
  'mod+w',
  'mod+shift+t',
  'mod+shift+n',
  'mod+shift+w',
])

const needsModifier = new Set(['escape', 'tab', 'enter', 'space'])

export const isBrowserReserved = (keys: string) => browserKeeps.has(normalise(keys))

export const isAllowedShortcut = (keys: string) => !needsModifier.has(normalise(keys))
