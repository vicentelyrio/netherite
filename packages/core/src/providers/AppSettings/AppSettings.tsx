import type { ReactElement } from 'react'
import { useQuery } from '@apollo/client'
import { PageLoader } from '@netherite/ds-components'

import { GET_APP_SETTINGS } from 'api/AppSettings/query'

import { AppContext } from './useAppSettings'

export type ProviderProps = {
  children: ReactElement
}

export const AppSettings = ({ children }: ProviderProps) => {
  const { data, loading } = useQuery(GET_APP_SETTINGS)

  return (
    <AppContext.Provider value={data?.getAppSettings}>
      {loading ? <PageLoader /> : children}
    </AppContext.Provider>
  )
}
