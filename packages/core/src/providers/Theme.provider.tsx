import type { ReactNode } from 'react'
import { ThemeProvider as Provider, Global } from 'theme-ui'
import { theme } from '@netherite/ds-tokens'

type ProviderProps = {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ProviderProps) => (
  <Provider theme={theme}>
    <Global styles={{ background: 'background' }} />
    {children}
  </Provider>
)

