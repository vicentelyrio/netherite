import type { ApolloClient, ApolloLink, NormalizedCacheObject } from '@apollo/client'

import { ServicesProviders } from 'providers/Services.provider'
import { ThemeProvider } from 'providers/Theme.provider'
import { RoutesProvider } from 'providers/Routes.provider'
import { AppSettingsProvider } from 'providers/AppSettings.provider'

export { buildClient } from 'providers/Services.provider'

export type AppType = {
  link?: ApolloLink
  client?: ApolloClient<NormalizedCacheObject>
}

export const App = ({ link, client }: AppType) => (
  <ServicesProviders client={client} link={link}>
    <ThemeProvider>
      <AppSettingsProvider>
        <RoutesProvider />
      </AppSettingsProvider>
    </ThemeProvider>
  </ServicesProviders>
)

