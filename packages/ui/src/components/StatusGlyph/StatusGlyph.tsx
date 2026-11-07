import { defaultSize } from './StatusGlyph.constants'
import { statusGlyphStyle } from './StatusGlyph.styles'
import type { StatusGlyphProps } from './StatusGlyph.types'
import { StatusGlyphCheck } from './StatusGlyphCheck'

export function StatusGlyph({
  type,
  status,
  progress = 0,
  size = defaultSize,
  label,
  dimDone,
  color,
}: StatusGlyphProps) {
  const hue = color ?? `var(--nt-color-type-${type})`
  return (
    <span
      className="nt-status-glyph"
      data-status={status}
      data-type={type}
      style={statusGlyphStyle({ status, color: hue, progress, size, dimDone })}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      {status === 'done' && <StatusGlyphCheck size={size} />}
    </span>
  )
}
