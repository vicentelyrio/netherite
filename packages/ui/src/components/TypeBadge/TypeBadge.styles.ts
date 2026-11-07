import type { ItemTypeName } from '@netherite/tokens'
import type { CSSProperties } from 'react'

export const badgeStyle = (type: ItemTypeName) =>
  ({ '--nt-badge-color': `var(--nt-color-type-${type})` }) as CSSProperties
