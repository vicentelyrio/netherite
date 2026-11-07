import { useI18nContext } from '@/infrastructure/i18n'
import { useEditorSettings } from '@/infrastructure/settings'
import { DurationSetting } from '../DurationSetting'
import { SettingsSection } from '../SettingsSection'
import { SwitchSetting } from '../SwitchSetting'

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
      <SwitchSetting
        label={text.vimMode()}
        hint={text.vimModeHint()}
        checked={vimMode}
        onChange={setVimMode}
      />
    </SettingsSection>
  )
}
