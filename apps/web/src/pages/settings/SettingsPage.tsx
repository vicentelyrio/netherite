import { SettingsHeading, ShortcutSettings } from '@/features/settings'
import { PageTemplate } from '@/templates'

export function SettingsPage() {
  return (
    <PageTemplate header={<SettingsHeading />}>
      <ShortcutSettings />
    </PageTemplate>
  )
}
