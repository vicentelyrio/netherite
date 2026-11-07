import { color, type EdgeKind } from '../color'
import type { EdgeStyle } from './graph.types'

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
