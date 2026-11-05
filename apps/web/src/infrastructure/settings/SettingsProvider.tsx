import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import {
  defaultSettings,
  parseSettings,
  type Settings,
  serializeSettings,
  storageKey,
} from './settings'

/** The part of `localStorage` the settings need; a test passes its own. */
export interface SettingsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface SettingsContextValue {
  readonly settings: Settings
  /** Changes some settings and keeps them. */
  readonly update: (change: (current: Settings) => Settings) => void
  /** Goes back to the defaults. */
  readonly reset: () => void
}

const Context = createContext<SettingsContextValue | undefined>(undefined)

export const useSettings = (): SettingsContextValue => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useSettings needs a SettingsProvider')
  return value
}

const browserStorage = (): SettingsStorage | undefined => {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/** Holds the person's settings, loads them once and saves every change. */
export function SettingsProvider({
  children,
  storage = browserStorage(),
}: {
  readonly children: ReactNode
  readonly storage?: SettingsStorage | undefined
}) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      return parseSettings(storage?.getItem(storageKey))
    } catch {
      return defaultSettings
    }
  })

  const save = useCallback(
    (next: Settings) => {
      setSettings(next)
      try {
        storage?.setItem(storageKey, serializeSettings(next))
      } catch {
        // Private windows and blocked storage: the settings last for this visit only.
      }
    },
    [storage],
  )

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update: (change) => save(change(settings)),
      reset: () => save(defaultSettings),
    }),
    [settings, save],
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}
