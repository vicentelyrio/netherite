import { StatCard } from '@/components'
import { formatWeekStart } from '@/infrastructure/datetime'
import { useStats } from '../StatsProvider'
import './StatsTiles.css'

/** The headline numbers: tasks done, the best week, ADRs accepted, weeks of history. */
export function StatsTiles() {
  const { data } = useStats()
  const done = data.completions.reduce((sum, c) => sum + c.count, 0)
  const adrs = data.adrs.reduce((sum, a) => sum + a.accepted, 0)
  const best = [...data.completions].sort((a, b) => b.count - a.count)[0]
  return (
    <div className="st-tiles">
      <StatCard value={done} label="tasks done" />
      <StatCard
        value={best ? best.count : 0}
        label={best ? `best week · ${formatWeekStart(best.week)}` : 'best week'}
      />
      <StatCard value={adrs} label="ADRs accepted" />
      <StatCard value={data.completions.length} label="weeks of history" />
    </div>
  )
}
