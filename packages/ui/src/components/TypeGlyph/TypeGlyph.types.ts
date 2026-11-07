import type { GlyphBox, ItemTypeName } from '@netherite/tokens'

export interface TypeGlyphProps {
  readonly type: ItemTypeName
  readonly box?: GlyphBox
  readonly hollow?: boolean
}
