import { createContext, useContext } from 'react'
import type { AppSettings } from '@netherite/service-graphql'

export type AppSettingsType = AppSettings

export const AppContext = createContext<AppSettingsType | null>(null)

export const useAppSettings = ():AppSettingsType => {
  const appSettings = useContext<AppSettingsType | null>(AppContext)

  if (!appSettings) return {} as AppSettingsType

  return appSettings
}

