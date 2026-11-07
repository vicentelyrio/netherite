import type { CSSProperties } from 'react'

export type IconSize = 'rail' | 'switcher' | 'inline' | 'pill' | number

export interface IconProps {
  readonly name: string
  readonly size?: IconSize
  readonly weight?: 300 | 400 | 500
  readonly filled?: boolean
  readonly label?: string
  readonly className?: string
  readonly style?: CSSProperties
}
