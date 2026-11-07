import { designColor } from '@netherite/ui'
import { labelCharWidth, labelHeightExtra, labelMax, labelPadding } from './GraphView.constants'
import type { Placed } from './layout'

export function NodeLabel({
  node,
  x,
  y,
  anchor,
  size,
  weight,
  color,
}: {
  readonly node: Placed
  readonly x: number
  readonly y: number
  readonly anchor: 'start' | 'middle' | 'end'
  readonly size: number
  readonly weight: number
  readonly color: string
}) {
  const text = node.title.length > labelMax ? `${node.title.slice(0, labelMax - 1)}…` : node.title
  const width = text.length * size * labelCharWidth + labelPadding
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'start' ? x : x - width
  return (
    <g className="gv-label" pointerEvents="none">
      <rect
        x={left}
        y={y}
        width={width}
        height={size + labelHeightExtra}
        rx={4}
        fill={designColor.graph.labelBg}
      />
      <text
        x={left + width / 2}
        y={y + size}
        textAnchor="middle"
        fontSize={size}
        fontWeight={weight}
        fill={color}
      >
        {text}
      </text>
    </g>
  )
}
