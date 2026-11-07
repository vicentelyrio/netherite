import { settingDefaults } from '@netherite/schema'
import { SegmentedControl } from '@netherite/ui'
import { type Locales, languages, useI18nContext } from '@/infrastructure/i18n'
import { useLanguage, useNoticeSettings } from '@/infrastructure/settings'
import { DurationSetting } from '../DurationSetting'
import { SettingRow } from '../SettingRow'
import { SettingsSection } from '../SettingsSection'
import { ThemeSetting } from '../ThemeSetting'

const noticePresetsMs = [3000, 5000, 10_000, 20_000]
const millisecondsPerSecond = 1000

export function GeneralSettings() {
  const { LL } = useI18nContext()
  const text = LL.settings.general
  const { lifetimeMs, setLifetimeMs } = useNoticeSettings()
  const { language, setLanguage } = useLanguage()
  return (
    <SettingsSection title={text.title()} subtitle={text.subtitle()}>
      <SettingRow label={text.language()} hint={text.languageHint()}>
        <SegmentedControl
          aria-label={text.language()}
          value={language}
          onChange={(next) => setLanguage(next as Locales)}
          data={languages.map(({ id, name }) => ({ value: id, label: name }))}
        />
      </SettingRow>
      <ThemeSetting />
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
