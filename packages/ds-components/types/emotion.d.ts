import '@emotion/react'
import type { Theme as ThemeDS } from '@netherite/ds-tokens'

declare module '@emotion/react' {
  // eslint-disable-next-line
  export interface Theme extends ThemeDS {}
}
