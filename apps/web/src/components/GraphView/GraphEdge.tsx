import { designColor, graphMetrics, statusGlyph } from '@netherite/ui'
import { edgeOpacity } from './GraphView.constants'
import type { Placed } from './layout'
import { styleOf } from './styleOf'

export function GraphEdge({
  kind,
  a,
  b,
  hot,
  warm,
  filtered,
  targetRadius,
  zoom,
}: {
  readonly kind: string
  readonly a: Placed
  readonly b: Placed
  readonly hot: boolean
  readonly warm: boolean
  readonly filtered: boolean
  readonly targetRadius: number
  readonly zoom: number
}) {
  const s = styleOf(kind)
  const typed = kind !== 'belongs_to' && kind !== 'reference'
  let x2 = b.x
  let y2 = b.y
  if (s.arrow) {
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const gap = targetRadius + graphMetrics.arrowGap * zoom
    x2 = b.x - ((b.x - a.x) / len) * gap
    y2 = b.y - ((b.y - a.y) / len) * gap
  }
  return (
    <line
      data-kind={kind}
      x1={a.x}
      y1={a.y}
      x2={x2}
      y2={y2}
      stroke={
        hot
          ? designColor.accent.edgeActive
          : warm
            ? designColor.graph.edgeWarm
            : typed
              ? designColor.graph.edgeTyped
              : designColor.graph.edge
      }
      strokeWidth={s.width + (hot ? graphMetrics.hotWidthBoost : 0)}
      strokeOpacity={
        filtered
          ? statusGlyph.filteredOpacity
          : hot
            ? graphMetrics.hotOpacity
            : warm
              ? graphMetrics.warmOpacity
              : typed
                ? edgeOpacity.typed
                : edgeOpacity.plain
      }
      strokeDasharray={s.dash.length > 0 ? s.dash.join(' ') : undefined}
      strokeLinecap="round"
      markerEnd={s.arrow ? `url(#${hot ? 'gv-arrow-hot' : 'gv-arrow'})` : undefined}
    />
  )
}
