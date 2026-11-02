import { icon as iconTokens } from '@netherite/tokens'
import type { CSSProperties } from 'react'

/** The sizes the design uses: the rail's 22, the switcher's 20, inline 16 and the pills' 14. */
export type IconSize = 'rail' | 'switcher' | 'inline' | 'pill' | number

const sizes = {
  rail: iconTokens.rail,
  switcher: iconTokens.switcher,
  inline: iconTokens.inline,
  pill: iconTokens.pill,
} as const

export interface IconProps {
  /** The Material Symbols name, such as `check` or `task_alt`. */
  readonly name: string
  /** Default `inline` (16px, weight 400). Each named size carries the stroke weight the design pairs it with. */
  readonly size?: IconSize
  /** Stroke weight, 300 to 500. Default: the one that goes with the size. */
  readonly weight?: 300 | 400 | 500
  /** The filled form, used for warnings and stale marks. */
  readonly filled?: boolean
  /** Describes the icon for screen readers. Without it the icon is decoration and is hidden from them. */
  readonly label?: string
  readonly className?: string
  readonly style?: CSSProperties
}

/** One icon from the Material Symbols Rounded font (see `fonts.css`). */
export function Icon({
  name,
  size = 'inline',
  weight,
  filled,
  label,
  className,
  style,
}: IconProps) {
  const base = typeof size === 'number' ? { size, weight: iconTokens.inline.weight } : sizes[size]
  const px = base.size
  return (
    <span
      className={`nt-icon${className ? ` ${className}` : ''}`}
      style={{
        fontSize: px,
        width: px,
        height: px,
        lineHeight: `${px}px`,
        overflow: 'hidden',
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight ?? base.weight}`,
        ...style,
      }}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      {name}
    </span>
  )
}
