import { ChartCard, StackedBarChart } from '@/components'
import { adrColors, adrOrder } from '../numbers'
import { useStats } from '../StatsProvider'
import '../ProgressCard/ProgressCard.css'
import './AdrActivityCard.css'

/** ADRs by the status they moved to, stacked per week. */
export function AdrActivityCard() {
  const { data } = useStats()
  return (
    <ChartCard
      title="ADR activity"
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
        label="ADRs by the status they moved to, per week"
      />
    </ChartCard>
  )
}
