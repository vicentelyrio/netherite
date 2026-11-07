import { designColor } from '@netherite/ui'

export function StaleDot({
  x,
  y,
  r,
}: {
  readonly x: number
  readonly y: number
  readonly r: number
}) {
  return (
    <circle
      cx={x + r * 0.55 + 3}
      cy={y - r * 0.55 - 3}
      r={3.5}
      fill={designColor.status.warning}
      stroke={designColor.bg.canvas}
      strokeWidth={2}
    />
  )
}
