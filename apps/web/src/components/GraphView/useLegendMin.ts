import { useState } from 'react'
import { legendStorageKey } from './GraphView.constants'

export const useLegendMin = () => {
  const [legendMin, setState] = useState(() => {
    try {
      return localStorage.getItem(legendStorageKey) === '1'
    } catch {
      return false
    }
  })
  const setLegendMin = (min: boolean) => {
    setState(min)
    try {
      localStorage.setItem(legendStorageKey, min ? '1' : '0')
    } catch {}
  }
  return [legendMin, setLegendMin] as const
}
