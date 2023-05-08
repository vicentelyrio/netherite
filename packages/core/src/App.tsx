import { Theme } from 'providers/Theme/Theme'
import { Routes } from 'providers/Routes/Routes'
import { AppSettings } from 'providers/AppSettings/AppSettings'

export const App = () => (
  <Theme>
    <AppSettings>
      <Routes />
    </AppSettings>
  </Theme>
)

