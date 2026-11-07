import { settingCatalog, settingDefaults } from '@netherite/schema'
import type { Locales } from '../i18n'
import { isLocale } from '../i18n/i18n-util'
import { type ActionId, isActionId } from '../shortcuts/actions'

export interface EditorPreferences {
  readonly vimMode: boolean
  readonly autosaveDelayMs: number
}

export interface NoticePreferences {
  readonly lifetimeMs: number
}

export interface Settings {
  readonly shortcuts: Readonly<Partial<Record<ActionId, string | null>>>
  readonly editor: EditorPreferences
  readonly notices: NoticePreferences
  readonly language: Locales | null
}

export const defaultSettings: Settings = {
  shortcuts: {},
  editor: {
    vimMode: settingDefaults.editor.vimMode,
    autosaveDelayMs: settingDefaults.editor.autosaveDelayMs,
  },
  notices: { lifetimeMs: settingDefaults.notices.lifetimeMs },
  language: null,
}

export const storageKey = 'netherite.settings'

const IntegerSetting = {
  AutosaveDelay: 'editor.autosaveDelayMs',
  NoticeLifetime: 'notices.lifetimeMs',
} as const

type IntegerSetting = (typeof IntegerSetting)[keyof typeof IntegerSetting]

const withinLimits = (key: IntegerSetting, value: number) => {
  const limits = settingCatalog.find((setting) => setting.key === key)
  return (
    Number.isInteger(value) &&
    value >= (limits?.min ?? Number.NEGATIVE_INFINITY) &&
    value <= (limits?.max ?? Number.POSITIVE_INFINITY)
  )
}

const parseInteger = (stored: unknown, key: IntegerSetting, fallback: number) =>
  typeof stored === 'number' && withinLimits(key, stored) ? stored : fallback

const parseShortcuts = (stored: unknown): Settings['shortcuts'] => {
  const shortcuts: Partial<Record<ActionId, string | null>> = {}
  if (stored !== null && typeof stored === 'object') {
    for (const [id, keys] of Object.entries(stored)) {
      if (isActionId(id) && (keys === null || (typeof keys === 'string' && keys !== ''))) {
        shortcuts[id] = keys
      }
    }
  }
  return shortcuts
}

const parseEditor = (stored: unknown): EditorPreferences => {
  const value = stored as Partial<Record<keyof EditorPreferences, unknown>> | null | undefined
  const { vimMode, autosaveDelayMs } = defaultSettings.editor
  return {
    vimMode: typeof value?.vimMode === 'boolean' ? value.vimMode : vimMode,
    autosaveDelayMs: parseInteger(
      value?.autosaveDelayMs,
      IntegerSetting.AutosaveDelay,
      autosaveDelayMs,
    ),
  }
}

const parseNotices = (stored: unknown): NoticePreferences => {
  const value = stored as Partial<Record<keyof NoticePreferences, unknown>> | null | undefined
  return {
    lifetimeMs: parseInteger(
      value?.lifetimeMs,
      IntegerSetting.NoticeLifetime,
      defaultSettings.notices.lifetimeMs,
    ),
  }
}

const parseLanguage = (stored: unknown): Locales | null =>
  typeof stored === 'string' && isLocale(stored) ? stored : null

export const parseSettings = (raw: string | null | undefined): Settings => {
  if (!raw) return defaultSettings
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return defaultSettings
  }
  const stored = value as {
    shortcuts?: unknown
    editor?: unknown
    notices?: unknown
    language?: unknown
  } | null
  return {
    shortcuts: parseShortcuts(stored?.shortcuts),
    editor: parseEditor(stored?.editor),
    notices: parseNotices(stored?.notices),
    language: parseLanguage(stored?.language),
  }
}

export const serializeSettings = (settings: Settings): string => JSON.stringify(settings)
