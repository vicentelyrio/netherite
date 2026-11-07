import type { ItemTypeName } from '@netherite/tokens'

export interface TypeBadgeProps {
  readonly type: ItemTypeName
  readonly glyphOnly?: boolean
  readonly hollow?: boolean
}
