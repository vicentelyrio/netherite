import { StatCard } from '@/components'
import { formatWeekStart } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useStats } from '../StatsProvider'
import './StatsTiles.css'

/** The headline numbers: tasks done, the best week, ADRs accepted, weeks of history. */
export function StatsTiles() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  const done = data.completions.reduce((sum, c) => sum + c.count, 0)
  const adrs = data.adrs.reduce((sum, a) => sum + a.accepted, 0)
  const best = [...data.completions].sort((a, b) => b.count - a.count)[0]
  return (
    <div className="st-tiles">
      <StatCard value={done} label={LL.stats.tiles.done()} />
      <StatCard
        value={best ? best.count : 0}
        label={
          best
            ? LL.stats.tiles.bestWeekOn({ week: formatWeekStart(best.week) })
            : LL.stats.tiles.bestWeek()
        }
      />
      <StatCard value={adrs} label={LL.stats.tiles.adrs()} />
      <StatCard value={data.completions.length} label={LL.stats.tiles.weeks()} />
    </div>
  )
}
