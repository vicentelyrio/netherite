import { type Locales, resolveLocale } from '../i18n'
import { useSettings } from './SettingsProvider'

const browserLanguages = (): ReadonlyArray<string> =>
  typeof navigator === 'undefined' ? [] : navigator.languages

export const useLanguage = () => {
  const { settings, update } = useSettings()
  return {
    language: settings.language ?? resolveLocale(browserLanguages()),
    setLanguage: (language: Locales) => update((s) => ({ ...s, language })),
  }
}
