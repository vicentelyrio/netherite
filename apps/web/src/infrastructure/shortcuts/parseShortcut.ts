import type { Combo } from './shortcuts.types'

const stepSeparator = ' '
const maxSteps = 2

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

export const stepsOf = (shortcut: string) => shortcut.trim().split(/\s+/)

export const parseSequence = (shortcut: string): ReadonlyArray<Combo> =>
  stepsOf(shortcut).map(parseShortcut)

export const isValidShortcut = (value: string): boolean => {
  try {
    return parseSequence(value).length <= maxSteps
  } catch {
    return false
  }
}

const normaliseStep = (step: string) => {
  const c = parseShortcut(step)
  return `${c.mod ? 'mod+' : ''}${c.alt ? 'alt+' : ''}${c.shift ? 'shift+' : ''}${c.key}`
}

export const normalise = (shortcut: string) =>
  stepsOf(shortcut).map(normaliseStep).join(stepSeparator)

export const joinSteps = (first: string, second: string) => `${first}${stepSeparator}${second}`
