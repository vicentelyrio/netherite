import type { ReactNode } from 'react'

import { ServicesProviders } from './Services.provider'
import { ThemeProvider } from './Theme.provider'

export type ProviderProps = {
  children: ReactNode
}

export const Providers = ({ children }: ProviderProps) => (
  <ServicesProviders>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </ServicesProviders>
)

