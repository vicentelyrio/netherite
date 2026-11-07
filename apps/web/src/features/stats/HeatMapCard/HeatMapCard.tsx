import { useLayoutEffect, useRef } from 'react'
import { ChartCard } from '@/components'
import { formatDate, formatDay, monthName, weekdayName } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { heatDays, heatLevel, heatSummary } from '../numbers'
import { useStats } from '../StatsProvider'
import './HeatMapCard.css'

const weekRows = [
  { key: 'mon', labelled: 1 },
  { key: 'tue' },
  { key: 'wed', labelled: 3 },
  { key: 'thu' },
  { key: 'fri', labelled: 5 },
  { key: 'sat' },
  { key: 'sun' },
] as const satisfies ReadonlyArray<{ readonly key: string; readonly labelled?: number }>

export function HeatMapCard() {
  const { LL } = useI18nContext()
  const { data, period } = useStats()
  const days = heatDays(data.heat.from, data.heat.to, data.heat.days)
  const max = Math.max(0, ...days.map((d) => d.count))
  const total = days.reduce((n, d) => n + d.count, 0)
  const summary = heatSummary(days)
  const weeks = Math.ceil(days.length / 7)
  const wrap = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (wrap.current !== null) wrap.current.scrollLeft = wrap.current.scrollWidth
  }, [days.length])
  const months: Array<{ label: string; week: number }> = []
  let last = -1
  for (let week = 0; week * 7 < days.length; week++) {
    const monday = days[week * 7]?.date
    if (monday === undefined) break
    const month = Number(monday.slice(5, 7)) - 1
    if (month !== last && (Number(monday.slice(8, 10)) <= 7 || week === 0)) {
      months.push({ label: monthName(month), week })
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
            {weekRows.map((row) => (
              <span key={row.key}>{'labelled' in row ? weekdayName(row.labelled) : ''}</span>
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
