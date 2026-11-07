import { badgeGlyph } from '@netherite/tokens'
import { glyphStyle, hollowAdr, themedGlyph } from './TypeGlyph.styles'
import type { TypeGlyphProps } from './TypeGlyph.types'

export function TypeGlyph({ type, box, hollow }: TypeGlyphProps) {
  const base = themedGlyph(box ?? badgeGlyph[type], type)
  const look = hollow && type === 'adr' ? hollowAdr(base) : base
  return (
    <span className="nt-type-glyph" data-type={type} aria-hidden="true" style={glyphStyle(look)} />
  )
}
