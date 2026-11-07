import { useSettings } from './SettingsProvider'
import type { EditorPreferences } from './settings'

export const useEditorSettings = () => {
  const { settings, update } = useSettings()
  const change = (next: Partial<EditorPreferences>) =>
    update((s) => ({ ...s, editor: { ...s.editor, ...next } }))
  return {
    ...settings.editor,
    setVimMode: (vimMode: boolean) => change({ vimMode }),
    setAutosaveDelayMs: (autosaveDelayMs: number) => change({ autosaveDelayMs }),
  }
}
