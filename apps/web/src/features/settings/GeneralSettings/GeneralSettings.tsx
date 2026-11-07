import { settingDefaults } from '@netherite/schema'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNoticeSettings } from '@/infrastructure/settings'
import { DurationSetting } from '../DurationSetting'
import { SettingsSection } from '../SettingsSection'

const noticePresetsMs = [3000, 5000, 10_000, 20_000]
const millisecondsPerSecond = 1000

export function GeneralSettings() {
  const { LL } = useI18nContext()
  const text = LL.settings.general
  const { lifetimeMs, setLifetimeMs } = useNoticeSettings()
  return (
    <SettingsSection title={text.title()} subtitle={text.subtitle()}>
      <DurationSetting
        label={text.noticeDuration()}
        hint={text.noticeDurationHint({
          seconds: settingDefaults.notices.lifetimeWithActionsMs / millisecondsPerSecond,
        })}
        presets={noticePresetsMs}
        value={lifetimeMs}
        onChange={setLifetimeMs}
      />
    </SettingsSection>
  )
}
