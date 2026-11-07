import { designColor, type ItemTypeName, nodeSpec, statusGlyph } from '@netherite/ui'
import type { NodeStatus } from './GraphView.types'
import { wedge } from './wedge'

export function StatusShape({
  type,
  status,
  progress,
  x,
  y,
  scale,
}: {
  readonly type: ItemTypeName
  readonly status: NodeStatus
  readonly progress: number
  readonly x: number
  readonly y: number
  readonly scale: number
}) {
  const r = nodeSpec[type].radius * scale
  const color = designColor.type[type]
  const ring = r * 2 >= statusGlyph.thickFrom ? statusGlyph.ring.thick : statusGlyph.ring.thin
  const inner = r - ring / 2
  const fill = status === 'hold' ? statusGlyph.holdFill : color
  if (status === 'done') {
    const c = r * 0.72
    return (
      <g opacity={statusGlyph.doneOpacity}>
        <circle cx={x} cy={y} r={r} fill={color} />
        <path
          d={`M${x - c * 0.5},${y + c * 0.05} L${x - c * 0.1},${y + c * 0.45} L${x + c * 0.55},${y - c * 0.4}`}
          fill="none"
          stroke={designColor.bg.shell}
          strokeWidth={Math.max(1.2, r * 0.22)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    )
  }
  return (
    <g>
      {status === 'progress' && (
        <circle
          cx={x}
          cy={y}
          r={r + statusGlyph.halo.gap + statusGlyph.halo.width / 2}
          fill="none"
          stroke={color}
          strokeWidth={statusGlyph.halo.width}
        />
      )}
      <circle cx={x} cy={y} r={inner} fill={color} fillOpacity={statusGlyph.trackShare / 100} />
      {progress > 0 && <path d={wedge(x, y, inner, progress)} fill={fill} />}
      <circle
        cx={x}
        cy={y}
        r={inner}
        fill="none"
        stroke={color}
        strokeWidth={ring}
        strokeDasharray={status === 'hold' ? `${ring * 2} ${ring * 1.4}` : undefined}
      />
    </g>
  )
}
