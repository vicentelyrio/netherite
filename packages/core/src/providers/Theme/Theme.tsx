import type { ReactElement } from 'react'
import { ThemeProvider as Provider } from 'theme-ui'
import { theme } from '@netherite/ds-tokens'
import 'the-new-css-reset/css/reset.css'

type ProviderProps = {
  children: ReactElement
}

export const Theme = ({ children }: ProviderProps) => (
  <Provider theme={theme}>
    {children}
  </Provider>
)

