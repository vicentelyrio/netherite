import type { PointerEvent } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { bubbleOpacity, bubbleStroke, countOffset } from './TagsMap.constants'

export function TagBubble({
  name,
  total,
  place,
  color,
  on,
  dim,
  onPress,
  onToggle,
}: {
  readonly name: string
  readonly total: number
  readonly place: { readonly x: number; readonly y: number; readonly r: number }
  readonly color: string
  readonly on: boolean
  readonly dim: boolean
  readonly onPress: (e: PointerEvent<SVGGElement>) => void
  readonly onToggle: (viaKeyboard: boolean) => void
}) {
  const { LL } = useI18nContext()
  return (
    // biome-ignore lint/a11y/useSemanticElements: an SVG group cannot be a <button>
    <g
      role="button"
      tabIndex={0}
      aria-pressed={on}
      aria-label={LL.tags.map.bubble({ name, count: total })}
      className="tm-bubble"
      data-dim={dim || undefined}
      onPointerDown={onPress}
      onClick={(e) => {
        e.stopPropagation()
        onToggle(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle(true)
        }
      }}
    >
      <circle
        cx={place.x}
        cy={place.y}
        r={place.r}
        fill={color}
        fillOpacity={bubbleOpacity}
        stroke={color}
        strokeWidth={on ? bubbleStroke.on : bubbleStroke.off}
      />
      <text
        x={place.x}
        y={place.y}
        className="tm-name"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {name}
      </text>
      <text
        x={place.x}
        y={place.y + countOffset}
        className="tm-count"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {total}
      </text>
    </g>
  )
}
