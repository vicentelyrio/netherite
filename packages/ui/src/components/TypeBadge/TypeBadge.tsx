import { TypeGlyph } from '../TypeGlyph'
import { useUiLabels } from '../UiLabels'
import { badgeStyle } from './TypeBadge.styles'
import type { TypeBadgeProps } from './TypeBadge.types'

export function TypeBadge({ type, glyphOnly, hollow }: TypeBadgeProps) {
  const { types } = useUiLabels()
  return (
    <span className="nt-type-badge" data-type={type} style={badgeStyle(type)}>
      <TypeGlyph type={type} {...(hollow === undefined ? {} : { hollow })} />
      <span className={glyphOnly ? 'nt-visually-hidden' : undefined}>{types[type]}</span>
    </span>
  )
}
