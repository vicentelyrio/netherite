import { useLayoutEffect, useRef } from 'react'
import { ChartCard } from '@/components'
import { formatDate, formatDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { heatDays, heatLevel, heatSummary } from '../numbers'
import { useStats } from '../StatsProvider'
import './HeatMapCard.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = [
  ['mon', 'Mon'],
  ['tue', ''],
  ['wed', 'Wed'],
  ['thu', ''],
  ['fri', 'Fri'],
  ['sat', ''],
  ['sun', ''],
] as const

/** Commits per day over the last 53 weeks, a column per week from Monday, with months and weekdays. */
export function HeatMapCard() {
  const { LL } = useI18nContext()
  const { data, period } = useStats()
  const days = heatDays(data.heat.from, data.heat.to, data.heat.days)
  const max = Math.max(0, ...days.map((d) => d.count))
  const total = days.reduce((n, d) => n + d.count, 0)
  const summary = heatSummary(days)
  const weeks = Math.ceil(days.length / 7)
  const wrap = useRef<HTMLDivElement>(null)
  // When the card is narrower than 53 weeks, the latest weeks are the ones in view.
  useLayoutEffect(() => {
    if (wrap.current !== null) wrap.current.scrollLeft = wrap.current.scrollWidth
  }, [days.length])
  // A month is written above the first week that starts in its first seven days.
  const months: Array<{ label: string; week: number }> = []
  let last = -1
  for (let week = 0; week * 7 < days.length; week++) {
    const monday = days[week * 7]?.date
    if (monday === undefined) break
    const month = Number(monday.slice(5, 7)) - 1
    if (month !== last && (Number(monday.slice(8, 10)) <= 7 || week === 0)) {
      months.push({ label: MONTHS[month] as string, week })
      last = month
    }
  }
  return (
    <ChartCard
      title={LL.stats.heat.title()}
      subtitle={LL.stats.heat.subtitle({ period: LL.stats.heat.periods[period]() })}
      aside={<span className="app-muted">{LL.stats.heat.total({ count: total, weeks })}</span>}
    >
      <div className="hm-wrap" ref={wrap}>
        <div className="hm-months" aria-hidden="true">
          {months.map((m) => (
            <span key={m.week} style={{ left: m.week * 14 }}>
              {m.label}
            </span>
          ))}
        </div>
        <div className="hm-body">
          <div className="hm-weekdays" aria-hidden="true">
            {WEEKDAYS.map(([key, label]) => (
              <span key={key}>{label}</span>
            ))}
          </div>
          <div className="hm" role="img" aria-label={LL.stats.heat.label({ count: total, weeks })}>
            {days.map((d) => (
              <span
                key={d.date}
                className="hm-cell"
                data-level={heatLevel(d.count, max)}
                title={LL.stats.heat.day({ count: d.count, date: formatDate(d.date) })}
              />
            ))}
          </div>
        </div>
      </div>
      <dl className="hm-summary">
        <div>
          <dt>{LL.stats.heat.activeDays()}</dt>
          <dd>{summary.active}</dd>
        </div>
        <div>
          <dt>{LL.stats.heat.streak()}</dt>
          <dd>{LL.stats.heat.days({ count: summary.longest })}</dd>
        </div>
        <div>
          <dt>{LL.stats.heat.busiest()}</dt>
          <dd>
            {summary.busiest === undefined
              ? '—'
              : `${formatDay(summary.busiest.date)} · ${summary.busiest.count}`}
          </dd>
        </div>
      </dl>
      <div className="hm-foot">
        <span>{LL.stats.heat.hover()}</span>
        <span className="hm-scale" aria-hidden="true">
          {LL.stats.heat.less()}
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="hm-cell" data-level={l} />
          ))}
          {LL.stats.heat.more()}
        </span>
      </div>
    </ChartCard>
  )
}
