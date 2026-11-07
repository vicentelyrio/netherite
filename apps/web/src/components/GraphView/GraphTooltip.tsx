import { designColor, type ItemTypeName } from '@netherite/ui'
import { formatDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { tooltip } from './GraphView.constants'
import type { Placed } from './layout'

export function GraphTooltip({
  node,
  screen,
  radius,
  width,
  parentTitle,
  degree,
}: {
  readonly node: Placed
  readonly screen: { readonly x: number; readonly y: number }
  readonly radius: number
  readonly width: number
  readonly parentTitle: string | undefined
  readonly degree: number
}) {
  const { LL } = useI18nContext()
  const below = screen.y - radius < tooltip.edge
  return (
    <div
      role="tooltip"
      className="gv-tooltip"
      data-below={below || undefined}
      style={{
        left: Math.min(Math.max(screen.x, tooltip.edge), width - tooltip.edge),
        top: screen.y - radius - tooltip.gap + (below ? 2 * radius + tooltip.flip : 0),
      }}
    >
      <div className="gv-tooltip-kind">
        <span style={{ background: designColor.type[node.type as ItemTypeName] }} />
        {LL.common.types[node.type as ItemTypeName]()}
        {parentTitle === undefined ? '' : LL.components.graph.tooltipIn({ parent: parentTitle })}
      </div>
      <div className="gv-tooltip-title">
        {node.id} {node.title}
      </div>
      <div className="gv-tooltip-meta">
        {node.status !== undefined &&
          `${LL.components.graph.tooltipStatus({
            status: LL.components.graph.status[node.status](),
            percent: Math.round((node.progress ?? 0) * 100),
          })}${
            node.since === undefined
              ? ''
              : ` ${LL.components.graph.tooltipSince({ day: formatDay(node.since) })}`
          } · `}
        {LL.components.graph.links({ count: degree })}
      </div>
    </div>
  )
}
