import { type ActionId, isActionId } from '../shortcuts/actions'

/** What a person can change about the app, kept in the browser (not in the repository). */
export interface Settings {
  /** Their own keys for an action; an action not listed keeps its default. */
  readonly shortcuts: Readonly<Partial<Record<ActionId, string>>>
}

export const defaultSettings: Settings = { shortcuts: {} }

export const storageKey = 'netherite.settings'

/**
 * Settings from stored text. Anything unreadable, unknown or of the wrong type is dropped, so an
 * old or hand-edited value never stops the app from starting.
 */
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
