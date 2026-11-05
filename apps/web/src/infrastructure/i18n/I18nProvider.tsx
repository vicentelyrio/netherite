import type { ReactNode } from 'react'
import TypesafeI18n from './i18n-react'
import type { Locales } from './i18n-types'
import { loadLocale } from './i18n-util.sync'

/** The language the app is written in. Others are added as folders next to `en/`. */
export const baseLocale: Locales = 'en'

// Every language is bundled with the app and loaded up front, so a screen never waits for words.
loadLocale(baseLocale)

/** Gives every component the words: `const { LL } = useI18nContext()` then `LL.status.live()`. */
export function I18nProvider({
  locale = baseLocale,
  children,
}: {
  readonly locale?: Locales
  readonly children: ReactNode
}) {
  loadLocale(locale)
  return <TypesafeI18n locale={locale}>{children}</TypesafeI18n>
}
