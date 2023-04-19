import { ServicesProviders } from './Services.provider'
import { ThemeProvider } from './Theme.provider'
import { RoutesProvider } from './Routes.provider'
import { AppSettingsProvider } from './AppSettings.provider'

export const Providers = () => (
  <ServicesProviders>
    <ThemeProvider>
      <AppSettingsProvider>
        <RoutesProvider />
      </AppSettingsProvider>
    </ThemeProvider>
  </ServicesProviders>
)

