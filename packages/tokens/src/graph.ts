import { type ColorTokens, color, type EdgeKind, type ItemTypeName, type Scheme } from './color'

/** The outline of each kind of item, in badges, cards and the graph. Colour alone is not enough. */
export type GlyphShape =
  | 'diamond'
  | 'square'
  | 'circle'
  | 'hexagon'
  | 'pentagon'
  | 'triangle'
  | 'octagon'

export const glyphShape: Readonly<Record<ItemTypeName, GlyphShape>> = {
  goal: 'diamond',
  project: 'square',
  task: 'circle',
  adr: 'hexagon',
  doc: 'pentagon',
  context: 'triangle',
  runbook: 'octagon',
}

const sides: Record<Exclude<GlyphShape, 'circle'>, { n: number; rotation: number }> = {
  diamond: { n: 4, rotation: 0 },
  square: { n: 4, rotation: 45 },
  hexagon: { n: 6, rotation: 0 },
  pentagon: { n: 5, rotation: 0 },
  triangle: { n: 3, rotation: 0 },
  octagon: { n: 8, rotation: 22.5 },
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * The shape as an SVG path, centred in a `size` x `size` box with a small margin, so the same
 * outline can draw a badge, a graph node or a legend entry. Regular polygons point up.
 */
export const glyphPath = (shape: GlyphShape, size = 24) => {
  const c = size / 2
  const r = (size / 2) * 0.88
  if (shape === 'circle') {
    return `M ${round(c)} ${round(c - r)} A ${round(r)} ${round(r)} 0 1 1 ${round(c)} ${round(c + r)} A ${round(r)} ${round(r)} 0 1 1 ${round(c)} ${round(c - r)} Z`
  }
  const { n, rotation } = sides[shape]
  const points = Array.from({ length: n }, (_, i) => {
    const angle = ((rotation + (360 / n) * i - 90) * Math.PI) / 180
    return `${round(c + r * Math.cos(angle))} ${round(c + r * Math.sin(angle))}`
  })
  return `M ${points.join(' L ')} Z`
}

/** Graph node radius in px by type: goals are the biggest, tasks the smallest. */
export const nodeRadius: Readonly<Record<ItemTypeName, number>> = {
  goal: 11,
  project: 9,
  adr: 8,
  doc: 7,
  context: 7,
  runbook: 7,
  task: 6,
}

export const graphMetrics = {
  nodeStroke: 1.5,
  /** The ring around the focused node. */
  focusRing: 3,
  /** Opacity of nodes and edges that are not connected to the one under the pointer. */
  dimmedOpacity: 0.25,
  labelOffset: 4,
} as const

/** Which colour an edge takes. */
type EdgeColor = 'muted' | 'accent' | 'info' | 'adr' | 'success'

export interface EdgeStyle {
  readonly width: number
  /** SVG dash array; empty is a solid line. */
  readonly dash: readonly number[]
  /** Whether the line ends in an arrowhead (it has a direction that matters). */
  readonly arrow: boolean
  readonly opacity: number
  readonly color: EdgeColor
}

/**
 * Typed relations are strong lines; references from the text are faint; `co_changes`, derived
 * from git, is a dashed hint rather than a relation anyone wrote.
 */
export const edgeStyle: Readonly<Record<EdgeKind, EdgeStyle>> = {
  belongs_to: { width: 1.5, dash: [], arrow: false, opacity: 0.9, color: 'muted' },
  implements: { width: 1.5, dash: [6, 3], arrow: true, opacity: 0.9, color: 'adr' },
  explains: { width: 1.25, dash: [2, 3], arrow: true, opacity: 0.85, color: 'success' },
  supersedes: { width: 2, dash: [], arrow: true, opacity: 1, color: 'adr' },
  depends_on: { width: 1.5, dash: [], arrow: true, opacity: 0.9, color: 'info' },
  related: { width: 1, dash: [2, 2], arrow: false, opacity: 0.7, color: 'muted' },
  reference: { width: 1, dash: [], arrow: false, opacity: 0.35, color: 'muted' },
  co_changes: { width: 1, dash: [4, 4], arrow: false, opacity: 0.5, color: 'accent' },
}

const edgeColors = (c: ColorTokens): Record<EdgeColor, string> => ({
  muted: c.border.strong,
  accent: c.accent.fg,
  info: c.status.info,
  adr: c.type.adr,
  success: c.status.success,
})

/** The colour of an edge on a scheme. */
export const edgeColor = (scheme: Scheme, kind: EdgeKind) =>
  edgeColors(color[scheme])[edgeStyle[kind].color]
