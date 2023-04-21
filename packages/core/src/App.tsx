import { ServicesProviders } from 'providers/Services.provider'
import { ThemeProvider } from 'providers/Theme.provider'
import { RoutesProvider } from 'providers/Routes.provider'
import { AppSettingsProvider } from 'providers/AppSettings.provider'

export const App = () => (
  <ServicesProviders>
    <ThemeProvider>
      <AppSettingsProvider>
        <RoutesProvider />
      </AppSettingsProvider>
    </ThemeProvider>
  </ServicesProviders>
)

