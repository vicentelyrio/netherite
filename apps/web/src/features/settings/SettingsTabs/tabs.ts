export const settingsTabs = ['general', 'editor', 'shortcuts', 'workspace'] as const

export type SettingsTab = (typeof settingsTabs)[number]

export const defaultSettingsTab: SettingsTab = 'general'

export const isSettingsTab = (value: unknown): value is SettingsTab =>
  (settingsTabs as ReadonlyArray<unknown>).includes(value)
