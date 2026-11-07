import { iconStyle } from './Icon.styles'
import type { IconProps } from './Icon.types'

export function Icon({
  name,
  size = 'inline',
  weight,
  filled,
  label,
  className,
  style,
}: IconProps) {
  return (
    <span
      className={`nt-icon${className ? ` ${className}` : ''}`}
      style={{ ...iconStyle(size, weight, filled), ...style }}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      {name}
    </span>
  )
}
