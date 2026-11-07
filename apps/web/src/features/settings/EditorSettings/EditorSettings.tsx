import { Switch } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useEditorSettings } from '@/infrastructure/settings'
import { DurationSetting } from '../DurationSetting'
import { SettingRow } from '../SettingRow'
import { SettingsSection } from '../SettingsSection'

const autosavePresetsMs = [500, 1000, 2000, 5000]

export function EditorSettings() {
  const { LL } = useI18nContext()
  const text = LL.settings.editor
  const { vimMode, setVimMode, autosaveDelayMs, setAutosaveDelayMs } = useEditorSettings()
  return (
    <SettingsSection title={text.title()} subtitle={text.subtitle()}>
      <DurationSetting
        label={text.autosaveDelay()}
        hint={text.autosaveDelayHint()}
        presets={autosavePresetsMs}
        value={autosaveDelayMs}
        onChange={setAutosaveDelayMs}
      />
      <SettingRow label={text.vimMode()} hint={text.vimModeHint()}>
        <Switch
          aria-label={text.vimMode()}
          checked={vimMode}
          onChange={(event) => setVimMode(event.currentTarget.checked)}
        />
      </SettingRow>
    </SettingsSection>
  )
}
