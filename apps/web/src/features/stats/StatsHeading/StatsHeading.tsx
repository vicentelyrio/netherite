import { Banner } from '@netherite/ui'
import { Breadcrumbs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useStats } from '../StatsProvider'

/** Breadcrumb and title, with a warning when the history is cut short. */
export function StatsHeading() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  return (
    <div>
      <Breadcrumbs icon="bar_chart">
        <strong>{LL.stats.title()}</strong>
      </Breadcrumbs>
      <h1 className="app-title">{LL.stats.title()}</h1>
      {data.partial && (
        <Banner variant="warning" title={LL.stats.partial()}>
          {LL.stats.partialText()}
        </Banner>
      )}
    </div>
  )
}
