import { createContext, useContext, type ReactElement } from 'react'
import { useQuery } from '@apollo/client'
import { PageLoader } from '@netherite/ds-components'
import type { AppSettings } from '@netherite/service-graphql'

import { GET_APP_SETTINGS } from 'api/AppSettings/query'

export type ProviderProps = {
  children: ReactElement
}

export type AppSettingsType = AppSettings

export const AppContext = createContext<AppSettingsType | null>(null)

export const useAppSettings = ():AppSettingsType => {
  const appSettings = useContext<AppSettingsType | null>(AppContext)

  if (!appSettings) return {} as AppSettingsType

  return appSettings
}

export const AppSettingsProvider = ({ children }: ProviderProps) => {
  const { data, loading } = useQuery(GET_APP_SETTINGS)

  return (
    <AppContext.Provider value={data?.getAppSettings}>
      {loading ? <PageLoader /> : children}
    </AppContext.Provider>
  )
}
