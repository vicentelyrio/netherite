import { defaultTheme, themeById } from '@netherite/ui'
import { useSettings } from './SettingsProvider'

export const useTheme = () => {
  const { settings, update } = useSettings()
  return {
    theme: themeById(settings.theme ?? '') ?? defaultTheme,
    setTheme: (theme: string) => update((s) => ({ ...s, theme })),
  }
}
