import { color, colorVar, type GlyphBox, type ItemTypeName, stroke } from '@netherite/tokens'
import type { CSSProperties } from 'react'

const hexPair = 2
const fullAlpha = 255
const hundred = 100

const themedPaint = (paint: string, type: ItemTypeName) => {
  const hex = color.type[type]
  const ref = colorVar.type[type]
  if (paint.startsWith(hex) && paint.length === hex.length + hexPair) {
    const share = Math.round((Number.parseInt(paint.slice(hex.length), 16) / fullAlpha) * hundred)
    return `color-mix(in srgb, ${ref} ${share}%, transparent)`
  }
  return paint.replaceAll(hex, ref)
}

export const themedGlyph = (box: GlyphBox, type: ItemTypeName): GlyphBox => ({
  ...box,
  fill: themedPaint(box.fill, type),
  border: themedPaint(box.border, type),
})

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
  border: `${stroke.medium}px solid ${colorVar.type.adr}`,
})
