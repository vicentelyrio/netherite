import type { CSSProperties } from 'react'

export const pillStyle = (colorToken: string) =>
  ({ '--nt-pill-color': `var(--nt-color-${colorToken})` }) as CSSProperties
