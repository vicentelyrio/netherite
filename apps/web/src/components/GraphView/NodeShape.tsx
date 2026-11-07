import { designColor, type ItemTypeName, nodeSpec } from '@netherite/ui'

export function NodeShape({
  type,
  x,
  y,
  scale,
  hollow,
}: {
  readonly type: ItemTypeName
  readonly x: number
  readonly y: number
  readonly scale: number
  readonly hollow?: boolean
}) {
  const spec = nodeSpec[type]
  const r = spec.radius * scale
  const d = r * 2
  const fill = designColor.type[type]
  switch (spec.shape) {
    case 'diamond': {
      const side = d * 0.78
      return (
        <rect
          x={x - side / 2}
          y={y - side / 2}
          width={side}
          height={side}
          rx={2}
          fill={hollow ? 'transparent' : fill}
          stroke={hollow ? fill : 'none'}
          strokeWidth={1.5}
          transform={`rotate(45 ${x} ${y})`}
        />
      )
    }
    case 'square': {
      const side = d * 0.86
      return (
        <rect x={x - side / 2} y={y - side / 2} width={side} height={side} rx={3} fill={fill} />
      )
    }
    case 'ring':
      return <circle cx={x} cy={y} r={r - 1} fill={`${fill}33`} stroke={fill} strokeWidth={2} />
    case 'bar':
      return (
        <rect
          x={x - d * 0.65}
          y={y - d * 0.35}
          width={d * 1.3}
          height={d * 0.7}
          rx={3}
          fill={fill}
        />
      )
    default:
      return <circle cx={x} cy={y} r={r} fill={fill} />
  }
}
