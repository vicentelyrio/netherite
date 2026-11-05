import { createContext, useContext } from 'react'
import type { Api } from './api'

const ApiContext = createContext<Api | undefined>(undefined)

export const ApiProvider = ApiContext.Provider

/** The server client for this page. */
export const useApi = () => {
  const api = useContext(ApiContext)
  if (api === undefined) throw new Error('useApi needs an ApiProvider')
  return api
}
