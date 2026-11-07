import { EmptyState } from '@netherite/ui'
import { formatDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { pointOf, rowsOf, ticksOf, unitOf } from '../layout'
import { useTimeline } from '../TimelineProvider'
import { TimelineActivity } from './TimelineActivity'
import { TimelineRow } from './TimelineRow'
import './TimelineChart.css'

export function TimelineChart() {
  const { LL } = useI18nContext()
  const { data, window, zoom, showTasks, showDecisions, expanded, toggle } = useTimeline()
  const { from, to } = window
  const rows = rowsOf(data, { expanded, showTasks, showDecisions })
  const nothing =
    data.goals.length + data.projects.length + data.tasks.length + data.decisions.length === 0
  if (nothing) {
    return (
      <EmptyState
        icon="timeline"
        title={LL.timeline.empty.title()}
        description={LL.timeline.empty.text()}
      />
    )
  }
  const ticks = ticksOf(zoom, from, to)
  const unit = unitOf(zoom, from, to)
  const today = pointOf(data.today, from, to)
  return (
    <section className="tl" aria-label={LL.timeline.title()}>
      <div className="tl-axis">
        <div className="tl-axis-label" />
        <div className="tl-axis-track">
          {ticks.map((t) => {
            const at = pointOf(t.day, from, to)
            if (today !== undefined && at !== undefined && Math.abs(at - today) < 3) return null
            return at === undefined ? null : (
              <span
                key={t.day}
                className="tl-tick"
                data-major={t.major || undefined}
                style={{ left: `${at}%` }}
              >
                {unit === 'day' || unit === 'week' ? formatDay(t.day) : formatMonth(t.day, t.major)}
              </span>
            )
          })}
          {today !== undefined && (
            <span className="tl-today-badge" style={{ left: `${today}%` }}>
              {LL.timeline.todayOn({ day: formatDay(data.today) })}
            </span>
          )}
        </div>
      </div>
      <div className="tl-body">
        <div className="tl-overlay" aria-hidden="true">
          {ticks.map((t) => {
            const at = pointOf(t.day, from, to)
            return at === undefined ? null : (
              <span key={t.day} className="tl-grid" style={{ left: `${at}%` }} />
            )
          })}
          {today !== undefined && (
            <>
              <span className="tl-after" style={{ left: `${today}%` }} />
              <span className="tl-today" style={{ left: `${today}%` }} />
              <span className="tl-planned-label" style={{ left: `${Math.min(92, today + 1)}%` }}>
                {LL.timeline.planned()}
              </span>
            </>
          )}
        </div>
        {rows.map((row) => (
          <TimelineRow
            key={`${row.kind}-${row.item.id}`}
            row={row}
            today={data.today}
            from={from}
            to={to}
            onToggle={toggle}
          />
        ))}
      </div>
      <TimelineActivity unit={unit} />
    </section>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const formatMonth = (day: string, major: boolean) =>
  major ? day.slice(0, 4) : (MONTHS[Number(day.slice(5, 7)) - 1] as string)
