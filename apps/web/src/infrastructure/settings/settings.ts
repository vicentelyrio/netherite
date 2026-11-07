import { settingDefaults } from '@netherite/schema'
import { type ActionId, isActionId } from '../shortcuts/actions'

export interface EditorPreferences {
  readonly vimMode: boolean
}

export interface Settings {
  readonly shortcuts: Readonly<Partial<Record<ActionId, string | null>>>
  readonly editor: EditorPreferences
}

export const defaultSettings: Settings = {
  shortcuts: {},
  editor: { vimMode: settingDefaults.editor.vimMode },
}

export const storageKey = 'netherite.settings'

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
  const vimMode = (stored as { vimMode?: unknown } | null | undefined)?.vimMode
  return typeof vimMode === 'boolean' ? { vimMode } : defaultSettings.editor
}

export const parseSettings = (raw: string | null | undefined): Settings => {
  if (!raw) return defaultSettings
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return defaultSettings
  }
  const stored = value as { shortcuts?: unknown; editor?: unknown } | null
  return { shortcuts: parseShortcuts(stored?.shortcuts), editor: parseEditor(stored?.editor) }
}

export const serializeSettings = (settings: Settings): string => JSON.stringify(settings)
