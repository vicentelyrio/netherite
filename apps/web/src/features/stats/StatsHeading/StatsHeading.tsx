import { Banner } from '@netherite/ui'
import { Breadcrumbs } from '@/components'
import { formatDate } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useStats } from '../StatsProvider'

/** Breadcrumb and title, the dates the numbers cover, and a warning when the history is cut short. */
export function StatsHeading() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  return (
    <div>
      <Breadcrumbs icon="bar_chart">
        <strong>{LL.stats.title()}</strong>
      </Breadcrumbs>
      <h1 className="app-title">{LL.stats.title()}</h1>
      <p className="app-muted">
        {LL.stats.covers({ from: formatDate(data.from), to: formatDate(data.to) })}
      </p>
      {data.approximate && (
        <Banner variant="warning" title={LL.stats.partial()}>
          {LL.stats.partialText()}
        </Banner>
      )}
    </div>
  )
}
