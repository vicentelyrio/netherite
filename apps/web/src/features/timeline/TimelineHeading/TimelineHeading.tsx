import { Banner } from '@netherite/ui'
import { Breadcrumbs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useTimeline } from '../TimelineProvider'

/** Breadcrumb and title, with a warning when the history is cut short. */
export function TimelineHeading() {
  const { LL } = useI18nContext()
  const { data } = useTimeline()
  return (
    <div>
      <Breadcrumbs icon="timeline">
        <strong>{LL.timeline.title()}</strong>
      </Breadcrumbs>
      <h1 className="app-title">{LL.timeline.title()}</h1>
      {data.approximate && (
        <Banner variant="warning" title={LL.timeline.partial()}>
          {LL.timeline.partialText()}
        </Banner>
      )}
    </div>
  )
}
