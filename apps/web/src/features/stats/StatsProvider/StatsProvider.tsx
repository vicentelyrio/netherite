import { type Stats, Unavailable } from '@netherite/api'
import { Banner, EmptyState } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useState } from 'react'
import type { LineSeries } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { goalsQuery, projectsQuery, statsQuery } from '@/infrastructure/query'
import { lineColors, percent } from '../numbers'

export type ProgressBy = 'goals' | 'projects'

export interface StatsState {
  readonly data: typeof Stats.Type
  readonly by: ProgressBy
  readonly setBy: (by: ProgressBy) => void
  /** A line per goal or project: its percent done at the end of each week. */
  readonly series: ReadonlyArray<LineSeries & { readonly last: number | undefined }>
  readonly weeks: ReadonlyArray<string>
}

const Context = createContext<StatsState | undefined>(undefined)

export const useStats = (): StatsState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useStats needs a StatsProvider')
  return value
}

/** Loads the stats from git history; says so instead when there is none, or loading fails. */
export function StatsProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const stats = useQuery(statsQuery(api))
  const goals = useQuery(goalsQuery(api))
  const projects = useQuery(projectsQuery(api))
  const [by, setBy] = useState<ProgressBy>('goals')

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
  const data = stats.data
  const titles = new Map([
    ...(goals.data?.goals ?? []).map((g) => [g.id, g.title] as const),
    ...(projects.data?.projects ?? []).map((p) => [p.id, p.title] as const),
  ])
  const record = data.progress[by]
  const weeks = [
    ...new Set(Object.values(record).flatMap((points) => points.map((p) => p.week))),
  ].sort()
  const series = Object.entries(record)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, points], i) => {
      const last = points.at(-1)
      return {
        id,
        title: titles.get(id) ?? id,
        color: lineColors[i % lineColors.length] as string,
        points: points.map((p) => ({ week: p.week, value: percent(p) })),
        last: last ? percent(last) : undefined,
      }
    })
  return <Context.Provider value={{ data, by, setBy, series, weeks }}>{children}</Context.Provider>
}
