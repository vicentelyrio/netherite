import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@apollo/client'
import { PageLoader } from '@netherite/ds-components'

import { GET_APP_SETTINGS } from 'api/AppSettings/query'

export type ProviderProps = {
  children: ReactNode
}

export const AppContext = createContext(null)

export const useAppSettings = () => useContext(AppContext)

export const AppSettingsProvider = ({ children }: ProviderProps) => {
  const { data, loading } = useQuery(GET_APP_SETTINGS)

  if (loading) return <PageLoader />

  return (
    <AppContext.Provider value={data?.getAppSettings}>
      {children}
    </AppContext.Provider>
  )
}
