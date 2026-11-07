import { useI18nContext } from '@/infrastructure/i18n'

export function SettingsHeading() {
  const { LL } = useI18nContext()
  return <h1 className="kn-h1">{LL.settings.title()}</h1>
}
