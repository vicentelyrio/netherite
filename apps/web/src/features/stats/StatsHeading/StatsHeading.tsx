import { Banner } from '@netherite/ui'
import { Breadcrumbs } from '@/components'
import { useStats } from '../StatsProvider'

/** Breadcrumb and title, with a warning when the history is cut short. */
export function StatsHeading() {
  const { data } = useStats()
  return (
    <div>
      <Breadcrumbs icon="bar_chart">
        <strong>Stats</strong>
      </Breadcrumbs>
      <h1 className="app-title">Stats</h1>
      {data.partial && (
        <Banner variant="warning" title="History is cut short">
          This is a shallow clone, so the earliest weeks are missing.
        </Banner>
      )}
    </div>
  )
}
