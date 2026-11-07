import { formatDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { activityBars, barsAreDaily } from '../activityBars'
import type { TickUnit } from '../layout'
import { useTimeline } from '../TimelineProvider'
import { spanStyle } from './TimelineChart.styles'

export function TimelineActivity({ unit }: { readonly unit: TickUnit }) {
  const { LL } = useI18nContext()
  const { data, window } = useTimeline()
  return (
    <div className="tl-row tl-activity" data-kind="activity">
      <div className="tl-label">
        {barsAreDaily(unit) ? LL.timeline.activityPerDay() : LL.timeline.activityPerWeek()}
      </div>
      <div className="tl-track">
        {activityBars(data, unit, window.from, window.to).map((bar) => (
          <span
            key={bar.start}
            className="tl-activity-bar"
            style={{ ...spanStyle(bar.span), height: `${bar.height}%` }}
            title={LL.timeline.activityBar({ count: bar.count, day: formatDay(bar.start) })}
          />
        ))}
      </div>
    </div>
  )
}
