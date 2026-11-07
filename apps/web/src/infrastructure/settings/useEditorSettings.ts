import { useSettings } from './SettingsProvider'

export const useEditorSettings = () => {
  const { settings, update } = useSettings()
  return {
    vimMode: settings.editor.vimMode,
    setVimMode: (vimMode: boolean) => update((s) => ({ ...s, editor: { ...s.editor, vimMode } })),
  }
}
