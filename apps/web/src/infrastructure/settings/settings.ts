import { type ActionId, isActionId } from '../shortcuts/actions'

export interface Settings {
  readonly shortcuts: Readonly<Partial<Record<ActionId, string>>>
}

export const defaultSettings: Settings = { shortcuts: {} }

export const storageKey = 'netherite.settings'

export const parseSettings = (raw: string | null | undefined): Settings => {
  if (!raw) return defaultSettings
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return defaultSettings
  }
  const shortcuts: Partial<Record<ActionId, string>> = {}
  const stored = (value as { shortcuts?: unknown } | null)?.shortcuts
  if (stored !== null && typeof stored === 'object') {
    for (const [id, keys] of Object.entries(stored)) {
      if (isActionId(id) && typeof keys === 'string' && keys !== '') shortcuts[id] = keys
    }
  }
  return { shortcuts }
}

export const serializeSettings = (settings: Settings): string => JSON.stringify(settings)
