import { createContext, type ReactNode, useContext } from 'react'
import { defaultUiLabels } from './UiLabels.constants'
import type { UiLabels } from './UiLabels.types'

const Context = createContext<UiLabels>(defaultUiLabels)

export const useUiLabels = () => useContext(Context)

export function UiLabelsProvider({
  labels,
  children,
}: {
  readonly labels: UiLabels
  readonly children: ReactNode
}) {
  return <Context.Provider value={labels}>{children}</Context.Provider>
}
