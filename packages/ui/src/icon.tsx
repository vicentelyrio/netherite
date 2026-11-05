import { icon as iconTokens } from '@netherite/tokens'
import type { CSSProperties } from 'react'

export type IconSize = 'rail' | 'switcher' | 'inline' | 'pill' | number

const sizes = {
  rail: iconTokens.rail,
  switcher: iconTokens.switcher,
  inline: iconTokens.inline,
  pill: iconTokens.pill,
} as const

export interface IconProps {
  readonly name: string
  readonly size?: IconSize
  readonly weight?: 300 | 400 | 500
  readonly filled?: boolean
  readonly label?: string
  readonly className?: string
  readonly style?: CSSProperties
}

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
