import { ChartCard } from '@/components'
import { formatDate } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { heatDays, heatLevel } from '../numbers'
import { useStats } from '../StatsProvider'
import './HeatMapCard.css'

/** Commits per day over the last 53 weeks, a column per week from Monday. */
export function HeatMapCard() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  const days = heatDays(data.heat.from, data.heat.to, data.heat.days)
  const max = Math.max(0, ...days.map((d) => d.count))
  const total = days.reduce((n, d) => n + d.count, 0)
  return (
    <ChartCard
      title={LL.stats.heat.title()}
      aside={<span className="app-muted">{LL.stats.heat.total({ count: total })}</span>}
    >
      <div className="hm" role="img" aria-label={LL.stats.heat.label({ count: total })}>
        {days.map((d) => (
          <span
            key={d.date}
            className="hm-cell"
            data-level={heatLevel(d.count, max)}
            title={LL.stats.heat.day({ count: d.count, date: formatDate(d.date) })}
          />
        ))}
      </div>
    </ChartCard>
  )
}
