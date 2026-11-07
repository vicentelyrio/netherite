import type { Locales } from './i18n-types'
import { baseLocale, isLocale } from './i18n-util'

export const languages: ReadonlyArray<{ readonly id: Locales; readonly name: string }> = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'pt-BR', name: 'Português (Brasil)' },
]

const families: Readonly<Record<string, Locales>> = { en: 'en', es: 'es', pt: 'pt-BR' }

const localeOf = (language: string) => {
  if (isLocale(language)) return language
  const family = language.split('-')[0]?.toLowerCase() ?? ''
  return Object.hasOwn(families, family) ? families[family] : undefined
}

export const resolveLocale = (browserLanguages: ReadonlyArray<string>): Locales =>
  browserLanguages.map(localeOf).find((locale) => locale !== undefined) ?? baseLocale
