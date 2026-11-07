export const settingsTabs = ['editor', 'shortcuts'] as const

export type SettingsTab = (typeof settingsTabs)[number]

export const defaultSettingsTab: SettingsTab = 'editor'

export const isSettingsTab = (value: unknown): value is SettingsTab =>
  (settingsTabs as ReadonlyArray<unknown>).includes(value)
