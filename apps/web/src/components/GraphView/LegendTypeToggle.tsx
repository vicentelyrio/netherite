import type { ItemTypeName } from '@netherite/ui'
import type { ReactNode } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
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
  const { LL } = useI18nContext()
  return (
    <label data-off={off || undefined}>
      <input type="checkbox" className="nt-visually-hidden" checked={!off} onChange={onToggle} />
      <span className="gv-glyph gv-glyph--small">
        <svg width={small.box} height={small.box} aria-hidden="true">
          <NodeShape type={type} x={small.centre} y={small.centre} scale={small.scale} />
        </svg>
      </span>
      {LL.common.types[type]()}
      {children}
    </label>
  )
}
