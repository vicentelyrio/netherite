import { TypeGlyph } from '../TypeGlyph'
import { typeLabels } from './TypeBadge.constants'
import { badgeStyle } from './TypeBadge.styles'
import type { TypeBadgeProps } from './TypeBadge.types'

export function TypeBadge({ type, glyphOnly, hollow }: TypeBadgeProps) {
  return (
    <span className="nt-type-badge" data-type={type} style={badgeStyle(type)}>
      <TypeGlyph type={type} {...(hollow === undefined ? {} : { hollow })} />
      <span className={glyphOnly ? 'nt-visually-hidden' : undefined}>{typeLabels[type]}</span>
    </span>
  )
}
