import { type PeriodStats, Unavailable } from '@netherite/api'
import { Banner, EmptyState } from '@netherite/ui'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { goalsQuery, knowledgeQuery, periodStatsQuery } from '@/infrastructure/query'

export type Period = '30d' | 'quarter' | 'year'
export const periods: ReadonlyArray<Period> = ['30d', 'quarter', 'year']

export interface StatsState {
  readonly data: typeof PeriodStats.Type
  readonly empty: boolean
  readonly period: Period
  readonly setPeriod: (period: Period) => void
  readonly area: string
  readonly setArea: (area: string) => void
}

const Context = createContext<StatsState | undefined>(undefined)

export const useStats = (): StatsState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useStats needs a StatsProvider')
  return value
}

export function StatsProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const [period, setPeriod] = useState<Period>('30d')
  const [area, setArea] = useState('')
  const stats = useQuery({
    ...periodStatsQuery(api, period, area === '' ? undefined : area),
    placeholderData: keepPreviousData,
  })
  const goals = useQuery(goalsQuery(api))
  const knowledge = useQuery(knowledgeQuery(api))

  if (stats.isPending || goals.isPending || knowledge.isPending)
    return <div className="app-page app-muted">{LL.common.loading()}</div>
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
  const onlyContext = knowledge.data?.items.every((item) => item.type === 'context') === true
  return (
    <Context.Provider
      value={{
        data: stats.data,
        empty: goals.data?.goals.length === 0 && onlyContext,
        period,
        setPeriod,
        area,
        setArea,
      }}
    >
      {children}
    </Context.Provider>
  )
}
