import { ChartCard, FilterTabs, LineChart } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { type ProgressBy, useStats } from '../StatsProvider'
import './ProgressCard.css'

/** Percent of tasks done at the end of each week, a line per goal or project, with a legend. */
export function ProgressCard() {
  const { LL } = useI18nContext()
  const { by, setBy, series, weeks } = useStats()
  const kinds: ReadonlyArray<{ value: ProgressBy; label: string }> = [
    { value: 'goals', label: LL.stats.progress.goals() },
    { value: 'projects', label: LL.stats.progress.projects() },
  ]
  return (
    <ChartCard
      title={LL.stats.progress.title()}
      aside={
        <FilterTabs label={LL.stats.progress.of()} options={kinds} value={by} onChange={setBy} />
      }
    >
      <LineChart
        series={series}
        weeks={weeks}
        label={by === 'goals' ? LL.stats.progress.eachGoal() : LL.stats.progress.eachProject()}
      />
      <ul className="st-legend">
        {series.map((s) => (
          <li key={s.id}>
            <span className="st-swatch" style={{ background: s.color }} />
            {s.title}
            <span className="app-muted">{s.last === undefined ? '—' : `${s.last}%`}</span>
          </li>
        ))}
        {series.length === 0 && <li className="app-muted">{LL.stats.progress.none()}</li>}
      </ul>
    </ChartCard>
  )
}
