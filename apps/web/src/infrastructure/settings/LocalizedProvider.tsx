import type { ReactNode } from 'react'
import { I18nProvider } from '../i18n'
import { useLanguage } from './useLanguage'

export function LocalizedProvider({ children }: { readonly children: ReactNode }) {
  const { language } = useLanguage()
  return <I18nProvider locale={language}>{children}</I18nProvider>
}
