import { BarChart, ChartCard } from '@/components'
import { useStats } from '../StatsProvider'

/** Tasks that reached a done state, per week. */
export function ThroughputCard() {
  const { data } = useStats()
  return (
    <ChartCard title="Tasks done per week">
      <BarChart data={data.completions} label="Tasks done per week" />
    </ChartCard>
  )
}
