import { Unavailable } from '@netherite/api'
import { Banner, EmptyState } from '@netherite/ui'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { isoDay, nowIso } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { timelineQuery } from '@/infrastructure/query'
import { fitWindow, type Timeline, windowFor, type Zoom } from '../layout'

export interface TimelineState {
  readonly data: Timeline
  /** The days the track shows. */
  readonly window: { readonly from: string; readonly to: string }
  readonly zoom: Zoom
  readonly setZoom: (zoom: Zoom) => void
  readonly showTasks: boolean
  readonly setShowTasks: (show: boolean) => void
  readonly showDecisions: boolean
  readonly setShowDecisions: (show: boolean) => void
  /** Projects whose tasks are listed under them. */
  readonly expanded: ReadonlySet<string>
  readonly toggle: (projectId: string) => void
}

const Context = createContext<TimelineState | undefined>(undefined)

export const useTimeline = (): TimelineState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useTimeline needs a TimelineProvider')
  return value
}

/** Loads the timeline for the zoom; says so instead when there is no git history, or loading fails. */
export function TimelineProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const [zoom, setZoom] = useState<Zoom>('fit')
  const [showTasks, setShowTasks] = useState(true)
  const [showDecisions, setShowDecisions] = useState(true)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  // A fixed zoom asks for its own days; `fit` asks for everything and sizes the window to it.
  const fixed = useMemo(
    () => (zoom === 'fit' ? undefined : windowFor(zoom, isoDay(nowIso()))),
    [zoom],
  )
  const query = useQuery({
    ...timelineQuery(api, fixed ?? {}),
    placeholderData: keepPreviousData,
  })

  if (query.isPending) return <div className="app-page app-muted">{LL.common.loading()}</div>
  if (query.isError) {
    return (
      <div className="app-page">
        {query.error instanceof Unavailable ? (
          <EmptyState
            icon="timeline"
            title={LL.timeline.noGit()}
            description={LL.timeline.noGitText()}
          />
        ) : (
          <Banner variant="danger" title={LL.timeline.loadError()}>
            {LL.common.serveHint()}
          </Banner>
        )}
      </div>
    )
  }
  const window = fixed ?? fitWindow(query.data)
  return (
    <Context.Provider
      value={{
        data: query.data,
        window,
        zoom,
        setZoom,
        showTasks,
        setShowTasks,
        showDecisions,
        setShowDecisions,
        expanded,
        toggle: (id) =>
          setExpanded((current) => {
            const next = new Set(current)
            if (!next.delete(id)) next.add(id)
            return next
          }),
      }}
    >
      {children}
    </Context.Provider>
  )
}
