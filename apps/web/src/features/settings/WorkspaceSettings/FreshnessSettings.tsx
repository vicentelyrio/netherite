import { useI18nContext } from '@/infrastructure/i18n'
import { NumberSetting } from '../NumberSetting'
import { SettingsSection } from '../SettingsSection'
import type { WorkspaceSectionProps } from './WorkspaceSettings.types'

export function FreshnessSettings({ settings, save }: WorkspaceSectionProps) {
  const { LL } = useI18nContext()
  const text = LL.settings.workspace.freshness
  const { drifting, stale } = settings.freshness
  return (
    <SettingsSection title={text.title()} subtitle={text.subtitle()}>
      <NumberSetting
        label={text.drifting()}
        hint={text.driftingHint()}
        value={drifting}
        max={stale}
        onChange={(next) => save({ freshness: { drifting: next } })}
      />
      <NumberSetting
        label={text.stale()}
        hint={text.staleHint()}
        value={stale}
        min={drifting}
        onChange={(next) => save({ freshness: { stale: next } })}
      />
    </SettingsSection>
  )
}
