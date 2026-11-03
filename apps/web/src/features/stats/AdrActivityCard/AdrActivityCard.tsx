import { ChartCard, StackedBarChart } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { adrColors, adrOrder } from '../numbers'
import { useStats } from '../StatsProvider'
import '../ProgressCard/ProgressCard.css'
import './AdrActivityCard.css'

/** ADRs by the status they moved to, stacked per week. */
export function AdrActivityCard() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  return (
    <ChartCard
      title={LL.stats.adrActivity()}
      aside={
        <ul className="st-legend st-legend--row">
          {adrOrder.map((k) => (
            <li key={k}>
              <span className="st-swatch" style={{ background: adrColors[k] }} />
              {k}
            </li>
          ))}
        </ul>
      }
    >
      <StackedBarChart
        data={data.adrs}
        parts={adrOrder}
        colors={adrColors}
        label={LL.stats.adrChart()}
      />
    </ChartCard>
  )
}
