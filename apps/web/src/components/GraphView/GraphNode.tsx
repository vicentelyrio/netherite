import { designColor, type ItemTypeName } from '@netherite/ui'
import type { PointerEvent } from 'react'
import type { Placed } from './layout'
import { NodeShape } from './NodeShape'
import { StaleDot } from './StaleDot'
import { StatusShape } from './StatusShape'

export function GraphNode({
  node: p,
  radius: r,
  scale,
  opacity,
  focused,
  hovered,
  glowing,
  onDragStart,
  onClick,
  onOpen,
  onHover,
}: {
  readonly node: Placed
  readonly radius: number
  readonly scale: number
  readonly opacity: number
  readonly focused: boolean
  readonly hovered: boolean
  readonly glowing: boolean
  readonly onDragStart: (e: PointerEvent) => void
  readonly onClick: () => void
  readonly onOpen: () => void
  readonly onHover: (on: boolean) => void
}) {
  const type = p.type as ItemTypeName
  const color = designColor.type[type]
  return (
    // biome-ignore lint/a11y/useSemanticElements: an SVG group cannot be a <button>
    <g
      role="button"
      tabIndex={0}
      aria-label={`${p.id} ${p.title}`}
      aria-pressed={focused}
      data-node={p.id}
      data-status={p.status}
      className="gv-node"
      opacity={opacity}
      onPointerDown={onDragStart}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onOpen()
        } else if (e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
    >
      {glowing && (
        <circle
          cx={p.x}
          cy={p.y}
          r={r + 4}
          fill="none"
          stroke={color}
          strokeWidth={2}
          className="gv-new"
        />
      )}
      {focused ? (
        <>
          <circle
            cx={p.x}
            cy={p.y}
            r={r + 5}
            fill="none"
            stroke={color}
            strokeWidth={2}
            className="gv-glow"
            style={{ filter: `drop-shadow(0 0 8px color-mix(in srgb, ${color} 60%, transparent))` }}
          />
          <circle
            cx={p.x}
            cy={p.y}
            r={r + 3.2}
            fill="none"
            stroke={designColor.bg.canvas}
            strokeWidth={2.4}
          />
        </>
      ) : (
        hovered && (
          <circle
            cx={p.x}
            cy={p.y}
            r={r + 3}
            fill="none"
            stroke={designColor.text.primary}
            strokeWidth={1.5}
          />
        )
      )}
      {p.status !== undefined ? (
        <StatusShape
          type={type}
          status={p.status}
          progress={p.progress ?? 0}
          x={p.x}
          y={p.y}
          scale={scale}
        />
      ) : (
        <NodeShape type={type} x={p.x} y={p.y} scale={scale} />
      )}
      {p.stale && <StaleDot x={p.x} y={p.y} r={r} />}
    </g>
  )
}
