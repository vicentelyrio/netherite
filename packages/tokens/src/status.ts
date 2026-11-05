import type { StateCategory } from './color'

export const statusNames = ['backlog', 'progress', 'hold', 'done'] as const
export type StatusName = (typeof statusNames)[number]

export const statusOfCategory: Readonly<Record<StateCategory, StatusName>> = {
  todo: 'backlog',
  active: 'progress',
  blocked: 'hold',
  done: 'done',
}

export const statusGlyph = {
  holdFill: '#6E7292',
  trackShare: 14,
  ring: { thin: 1.5, thick: 2 },
  thickFrom: 30,
  halo: { gap: 1.5, width: 1.5 },
  doneOpacity: 0.8,
  filteredOpacity: 0.12,
} as const
