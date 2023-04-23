import type { ApolloLink } from '@apollo/client'

import { ServicesProviders } from 'providers/Services.provider'
import { ThemeProvider } from 'providers/Theme.provider'
import { RoutesProvider } from 'providers/Routes.provider'
import { AppSettingsProvider } from 'providers/AppSettings.provider'

export type AppType = {
  link?: ApolloLink
}

export const App = ({ link }: AppType) => (
  <ServicesProviders link={link}>
    <ThemeProvider>
      <AppSettingsProvider>
        <RoutesProvider />
      </AppSettingsProvider>
    </ThemeProvider>
  </ServicesProviders>
)

