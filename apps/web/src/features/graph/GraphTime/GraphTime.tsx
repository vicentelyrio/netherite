import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { dayAt, dayIndex, stepFor } from '@/components'
import { useApi } from '@/infrastructure/api'
import { graphQuery, timelineQuery } from '@/infrastructure/query'

const FRAME_MS = 350
const AHEAD = 6

export interface GraphTimeState {
  readonly asOf: string | undefined
  readonly setAsOf: (day: string | undefined) => void
  readonly playing: boolean
  readonly togglePlay: () => void
  readonly range:
    | {
        readonly from: string
        readonly to: string
        readonly activity: ReadonlyArray<{ readonly week: string; readonly count: number }>
      }
    | undefined
}

const Context = createContext<GraphTimeState | undefined>(undefined)

export const useGraphTime = (): GraphTimeState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useGraphTime needs a GraphTimeProvider')
  return value
}

export function GraphTimeProvider({ children }: { readonly children: ReactNode }) {
  const api = useApi()
  const client = useQueryClient()
  const timeline = useQuery(timelineQuery(api))
  const [asOf, setAsOf] = useState<string | undefined>(undefined)
  const [playing, setPlaying] = useState(false)

  const range = useMemo(
    () =>
      timeline.data === undefined
        ? undefined
        : {
            from: timeline.data.from,
            to: timeline.data.today,
            activity: timeline.data.activity,
          },
    [timeline.data],
  )

  useEffect(() => {
    if (!playing || range === undefined) return
    const step = stepFor(range.from, range.to)
    const id = window.setInterval(() => {
      setAsOf((current) => {
        const at = current === undefined ? range.to : current
        const next = Math.min(dayIndex(range.from, range.to), dayIndex(range.from, at) + step)
        for (let i = 1; i <= AHEAD; i++) {
          const ahead = dayAt(range.from, Math.min(dayIndex(range.from, range.to), next + i * step))
          void client.prefetchQuery(graphQuery(api, ahead))
        }
        if (next >= dayIndex(range.from, range.to)) {
          setPlaying(false)
          return undefined
        }
        return dayAt(range.from, next)
      })
    }, FRAME_MS)
    return () => window.clearInterval(id)
  }, [playing, range, api, client])

  const value = useMemo<GraphTimeState>(
    () => ({
      asOf,
      setAsOf: (day) => {
        setAsOf(range !== undefined && day !== undefined && day >= range.to ? undefined : day)
      },
      playing,
      togglePlay: () => {
        if (!playing && asOf === undefined && range !== undefined) setAsOf(range.from)
        setPlaying((p) => !p)
      },
      range,
    }),
    [asOf, playing, range],
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useGraphAt = () => {
  const api = useApi()
  const { asOf } = useGraphTime()
  return useQuery({ ...graphQuery(api, asOf), placeholderData: keepPreviousData })
}
