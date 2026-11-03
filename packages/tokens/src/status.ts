import type { StateCategory } from './color'

/**
 * How far along a goal, project or task is (ADR-00021). Status is shown by fill, ring and halo and
 * never by hue: hue always means the item's type.
 */
export const statusNames = ['backlog', 'progress', 'hold', 'done'] as const
export type StatusName = (typeof statusNames)[number]

/** A task state's category decides its status, so a workspace can name its states as it likes. */
export const statusOfCategory: Readonly<Record<StateCategory, StatusName>> = {
  todo: 'backlog',
  active: 'progress',
  blocked: 'hold',
  done: 'done',
}

/** The parts of a status glyph that are the same for every type and size. */
export const statusGlyph = {
  /** The pie's fill while on hold: grey, with a dashed ring. */
  holdFill: '#6E7292',
  /** The unfilled part of the pie, as the share of the type colour that shows through. */
  trackShare: 14,
  /** Ring widths: thin below `thickFrom`, thick from there. */
  ring: { thin: 1.5, thick: 2 },
  thickFrom: 30,
  /** The halo that marks work in progress: a gap of canvas, then a ring. */
  halo: { gap: 1.5, width: 1.5 },
  /** Done items step back a little so open work stands out. */
  doneOpacity: 0.8,
  /** What the All / Open / Done filter fades the other nodes to. */
  filteredOpacity: 0.12,
} as const
