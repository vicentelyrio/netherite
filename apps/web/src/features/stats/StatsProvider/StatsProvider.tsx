import { type PeriodStats, Unavailable } from '@netherite/api'
import { Banner, EmptyState } from '@netherite/ui'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { periodStatsQuery } from '@/infrastructure/query'

export type Period = '30d' | 'quarter' | 'year'
export const periods: ReadonlyArray<Period> = ['30d', 'quarter', 'year']

export interface StatsState {
  readonly data: typeof PeriodStats.Type
  readonly period: Period
  readonly setPeriod: (period: Period) => void
  /** The area the numbers are limited to; empty for all. */
  readonly area: string
  readonly setArea: (area: string) => void
}

const Context = createContext<StatsState | undefined>(undefined)

export const useStats = (): StatsState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useStats needs a StatsProvider')
  return value
}

/** Loads the stats for a period and area from git history; says so when there is none. */
export function StatsProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const [period, setPeriod] = useState<Period>('30d')
  const [area, setArea] = useState('')
  const stats = useQuery({
    ...periodStatsQuery(api, period, area === '' ? undefined : area),
    placeholderData: keepPreviousData,
  })

  if (stats.isPending) return <div className="app-page app-muted">{LL.common.loading()}</div>
  if (stats.isError) {
    const noGit = stats.error instanceof Unavailable
    return (
      <div className="app-page">
        {noGit ? (
          <EmptyState
            icon="bar_chart"
            title={LL.stats.noGit()}
            description={LL.stats.noGitText()}
          />
        ) : (
          <Banner variant="danger" title={LL.stats.loadError()}>
            {LL.common.serveHint()}
          </Banner>
        )}
      </div>
    )
  }
  return (
    <Context.Provider value={{ data: stats.data, period, setPeriod, area, setArea }}>
      {children}
    </Context.Provider>
  )
}
