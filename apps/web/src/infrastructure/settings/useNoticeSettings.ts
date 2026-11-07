import { useSettings } from './SettingsProvider'

export const useNoticeSettings = () => {
  const { settings, update } = useSettings()
  return {
    ...settings.notices,
    setLifetimeMs: (lifetimeMs: number) =>
      update((s) => ({ ...s, notices: { ...s.notices, lifetimeMs } })),
  }
}
