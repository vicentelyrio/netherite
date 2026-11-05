import { color, type EdgeKind, type ItemTypeName, tint } from './color'

/** How a node is drawn: a disc, a diamond, a rounded square, a ring, or a bar. */
export type NodeShape = 'circle' | 'diamond' | 'square' | 'ring' | 'bar'

export interface NodeSpec {
  readonly shape: NodeShape
  /** Radius in px at node scale 1. */
  readonly radius: number
}

/** Graph nodes, from the graph component: goals are the biggest, tasks the smallest. */
export const nodeSpec: Readonly<Record<ItemTypeName, NodeSpec>> = {
  goal: { shape: 'circle', radius: 15 },
  project: { shape: 'circle', radius: 10.5 },
  task: { shape: 'circle', radius: 6 },
  adr: { shape: 'diamond', radius: 8 },
  doc: { shape: 'square', radius: 7.5 },
  context: { shape: 'ring', radius: 7.5 },
  runbook: { shape: 'bar', radius: 7 },
}

export interface GlyphBox {
  readonly width: number
  readonly height: number
  /** CSS border radius. */
  readonly radius: string
  /** Degrees. */
  readonly rotate: number
  readonly fill: string
  readonly border: string
}

const hollowAlpha = Math.round(tint.ring * 255)
  .toString(16)
  .padStart(2, '0')

/**
 * The box that draws a type's shape inside a square of side `diameter`, as the graph does: a
 * diamond is a rotated square at 78% of the size, a square 86%, a bar 130% wide and 70% tall, a
 * ring has a 2px edge over a 20% fill. A `superseded` ADR is the same diamond, hollow.
 */
export const glyphBox = (type: ItemTypeName, diameter: number, hollow = false): GlyphBox => {
  const c = color.type[type]
  const d = diameter
  switch (nodeSpec[type].shape) {
    case 'diamond':
      return {
        width: d * 0.78,
        height: d * 0.78,
        radius: '2px',
        rotate: 45,
        fill: hollow ? 'transparent' : c,
        border: hollow ? `1.5px solid ${c}` : 'none',
      }
    case 'square':
      return {
        width: d * 0.86,
        height: d * 0.86,
        radius: '3px',
        rotate: 0,
        fill: c,
        border: 'none',
      }
    case 'ring':
      return {
        width: d,
        height: d,
        radius: '50%',
        rotate: 0,
        fill: `${c}${hollowAlpha}`,
        border: `2px solid ${c}`,
      }
    case 'bar':
      return { width: d * 1.3, height: d * 0.7, radius: '3px', rotate: 0, fill: c, border: 'none' }
    default:
      return { width: d, height: d, radius: '50%', rotate: 0, fill: c, border: 'none' }
  }
}

/**
 * The small glyph inside a type badge (sheet T2). Goals, projects and tasks are not on the sheet:
 * they are discs, as in the graph.
 */
export const badgeGlyph: Readonly<Record<ItemTypeName, GlyphBox>> = {
  goal: { width: 8, height: 8, radius: '50%', rotate: 0, fill: color.type.goal, border: 'none' },
  project: {
    width: 8,
    height: 8,
    radius: '50%',
    rotate: 0,
    fill: color.type.project,
    border: 'none',
  },
  task: { width: 8, height: 8, radius: '50%', rotate: 0, fill: color.type.task, border: 'none' },
  adr: { width: 6, height: 6, radius: '2px', rotate: 45, fill: color.type.adr, border: 'none' },
  doc: { width: 7, height: 7, radius: '3px', rotate: 0, fill: color.type.doc, border: 'none' },
  context: {
    width: 8,
    height: 8,
    radius: '50%',
    rotate: 0,
    fill: `${color.type.context}${hollowAlpha}`,
    border: `1.5px solid ${color.type.context}`,
  },
  runbook: {
    width: 9,
    height: 5,
    radius: '2px',
    rotate: 0,
    fill: color.type.runbook,
    border: 'none',
  },
}

export const graphMetrics = {
  /** Nodes and edges away from the focus and the pointer. */
  dimmedOpacity: 0.3,
  /** An edge touching the pointer is this much thicker. */
  hotWidthBoost: 0.5,
  hotOpacity: 0.95,
  warmOpacity: 0.75,
  /** The stale-doc dot on a node. */
  staleDot: 7,
  /** Space between an arrowhead and the node it points at. */
  arrowGap: 5,
  labelSize: 12,
  labelSizeFocus: 13,
} as const

export interface EdgeStyle {
  readonly width: number
  /** SVG dash array; empty is a solid line. */
  readonly dash: readonly number[]
  /** Whether the line ends in an arrowhead. */
  readonly arrow: boolean
  readonly opacity: number
  readonly color: string
  /** Not in the design: these kinds were added for Netherite's other relations. */
  readonly inDesign: boolean
}

const typed = color.graph.edgeTyped

/** Edge styles: the five kinds in the graph legend, then three the design does not draw. */
export const edgeStyle: Readonly<Record<EdgeKind, EdgeStyle>> = {
  belongs_to: {
    width: 1,
    dash: [],
    arrow: false,
    opacity: 0.45,
    color: color.graph.edge,
    inDesign: true,
  },
  implements: { width: 1.5, dash: [], arrow: true, opacity: 0.7, color: typed, inDesign: true },
  explains: {
    width: 1.6,
    dash: [1.5, 4.5],
    arrow: false,
    opacity: 0.7,
    color: typed,
    inDesign: true,
  },
  supersedes: { width: 1.5, dash: [7, 4], arrow: true, opacity: 0.7, color: typed, inDesign: true },
  co_changes: {
    width: 1.25,
    dash: [10, 4, 2, 4],
    arrow: false,
    opacity: 0.7,
    color: typed,
    inDesign: true,
  },
  depends_on: { width: 1.5, dash: [], arrow: true, opacity: 0.7, color: typed, inDesign: false },
  related: { width: 1, dash: [2, 3], arrow: false, opacity: 0.7, color: typed, inDesign: false },
  reference: {
    width: 1,
    dash: [],
    arrow: false,
    opacity: 0.45,
    color: color.graph.edge,
    inDesign: false,
  },
}
