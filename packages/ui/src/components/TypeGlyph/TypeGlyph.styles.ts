import { color, type GlyphBox, stroke } from '@netherite/tokens'
import type { CSSProperties } from 'react'

export const glyphStyle = (box: GlyphBox): CSSProperties => ({
  width: box.width,
  height: box.height,
  borderRadius: box.radius,
  transform: box.rotate === 0 ? undefined : `rotate(${box.rotate}deg)`,
  background: box.fill,
  border: box.border,
})

export const hollowAdr = (box: GlyphBox): GlyphBox => ({
  ...box,
  fill: 'transparent',
  border: `${stroke.medium}px solid ${color.type.adr}`,
})
