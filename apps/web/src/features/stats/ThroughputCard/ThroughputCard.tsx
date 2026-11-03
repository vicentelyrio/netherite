import { BarChart, ChartCard } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useStats } from '../StatsProvider'

/** Tasks that reached a done state, per week. */
export function ThroughputCard() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  return (
    <ChartCard title={LL.stats.throughput()}>
      <BarChart data={data.completions} label={LL.stats.throughput()} />
    </ChartCard>
  )
}
