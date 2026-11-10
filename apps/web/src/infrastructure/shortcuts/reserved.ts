import { type ActionDefinition, type ActionId, actions } from './actions'
import { normalise, stepsOf } from './parseShortcut'

const browserKeeps = new Set([
  'mod+t',
  'mod+n',
  'mod+w',
  'mod+shift+t',
  'mod+shift+n',
  'mod+shift+w',
  'mod+l',
  'mod+p',
  'mod+d',
  'mod+y',
  'mod+r',
  'mod+f',
  'mod+[',
  'mod+]',
])

const browserTabKey = /^mod\+\d$/

const needsModifier = new Set(['escape', 'tab', 'enter', 'space'])

const sharedKeys = new Set(['.', ',', ';', '?'])

const sequenceLeader = 'g'

const singleStepScope = 'editor'

export type Refusal = 'modifier' | 'browser' | 'shared' | 'singleStep'

export const isBrowserReserved = (keys: string) => {
  const wanted = normalise(keys)
  return browserKeeps.has(wanted) || browserTabKey.test(wanted)
}

export const isAllowedShortcut = (keys: string) => !needsModifier.has(normalise(keys))

export const isSequenceLeader = (keys: string) => normalise(keys) === sequenceLeader

export const refusalFor = (id: ActionId, keys: string): Refusal | undefined => {
  const base: ActionDefinition = actions[id]
  if (base.scope === singleStepScope && stepsOf(keys).length > 1) return 'singleStep'
  if (normalise(base.keys) === normalise(keys)) return undefined
  if (!isAllowedShortcut(keys)) return 'modifier'
  if (isBrowserReserved(keys)) return 'browser'
  return sharedKeys.has(normalise(keys)) ? 'shared' : undefined
}
