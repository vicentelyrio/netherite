import { type ItemTypeName, typeLabels } from '@netherite/ui'
import type { ReactNode } from 'react'
import { NodeShape } from './NodeShape'

const small = { box: 10, centre: 5, scale: 0.5 } as const

export function LegendTypeToggle({
  type,
  off,
  onToggle,
  children,
}: {
  readonly type: ItemTypeName
  readonly off: boolean
  readonly onToggle: () => void
  readonly children?: ReactNode
}) {
  return (
    <label data-off={off || undefined}>
      <input type="checkbox" className="nt-visually-hidden" checked={!off} onChange={onToggle} />
      <span className="gv-glyph gv-glyph--small">
        <svg width={small.box} height={small.box} aria-hidden="true">
          <NodeShape type={type} x={small.centre} y={small.centre} scale={small.scale} />
        </svg>
      </span>
      {typeLabels[type]}
      {children}
    </label>
  )
}
