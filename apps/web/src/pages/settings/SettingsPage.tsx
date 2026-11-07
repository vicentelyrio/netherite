import { SettingsHeading, type SettingsTab, SettingsTabs } from '@/features/settings'
import { PageTemplate } from '@/templates'

export function SettingsPage({ tab }: { readonly tab?: SettingsTab | undefined }) {
  return (
    <PageTemplate header={<SettingsHeading />}>
      <SettingsTabs {...(tab ? { tab } : {})} />
    </PageTemplate>
  )
}
