import { type ReactNode, useEffect } from 'react'
import { setDateLocale } from '../datetime'
import TypesafeI18n, { useI18nContext } from './i18n-react'
import type { Locales } from './i18n-types'
import { loadAllLocales } from './i18n-util.sync'
import { TranslatedUi } from './TranslatedUi'

export const baseLocale: Locales = 'en'

loadAllLocales()

function FollowLocale({ locale }: { readonly locale: Locales }) {
  const { locale: shown, setLocale } = useI18nContext()
  useEffect(() => {
    if (shown !== locale) setLocale(locale)
    document.documentElement.lang = locale
  }, [locale, shown, setLocale])
  return null
}

export function I18nProvider({
  locale = baseLocale,
  children,
}: {
  readonly locale?: Locales
  readonly children: ReactNode
}) {
  setDateLocale(locale)
  return (
    <TypesafeI18n locale={locale}>
      <FollowLocale locale={locale} />
      <TranslatedUi>{children}</TranslatedUi>
    </TypesafeI18n>
  )
}
