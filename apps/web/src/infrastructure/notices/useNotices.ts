import { createContext, useContext } from 'react'
import type { Notices } from './notices.types'

export const NoticesContext = createContext<Notices | undefined>(undefined)

export const useNotices = () => {
  const value = useContext(NoticesContext)
  if (value === undefined) throw new Error('useNotices needs a NoticeProvider')
  return value
}
