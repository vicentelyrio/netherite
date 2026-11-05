import { color, type EdgeKind, type ItemTypeName, tint } from './color'

export type NodeShape = 'circle' | 'diamond' | 'square' | 'ring' | 'bar'

export interface NodeSpec {
  readonly shape: NodeShape
  readonly radius: number
}

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
  readonly radius: string
  readonly rotate: number
  readonly fill: string
  readonly border: string
}

const hollowAlpha = Math.round(tint.ring * 255)
  .toString(16)
  .padStart(2, '0')

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
  dimmedOpacity: 0.3,
  hotWidthBoost: 0.5,
  hotOpacity: 0.95,
  warmOpacity: 0.75,
  staleDot: 7,
  arrowGap: 5,
  labelSize: 12,
  labelSizeFocus: 13,
} as const

export interface EdgeStyle {
  readonly width: number
  readonly dash: readonly number[]
  readonly arrow: boolean
  readonly opacity: number
  readonly color: string
  readonly inDesign: boolean
}

const typed = color.graph.edgeTyped

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
