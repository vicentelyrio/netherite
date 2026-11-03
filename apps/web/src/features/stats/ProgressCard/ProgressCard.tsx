import { ChartCard, FilterTabs, LineChart } from '@/components'
import { type ProgressBy, useStats } from '../StatsProvider'
import './ProgressCard.css'

const kinds: ReadonlyArray<{ value: ProgressBy; label: string }> = [
  { value: 'goals', label: 'Goals' },
  { value: 'projects', label: 'Projects' },
]

/** Percent of tasks done at the end of each week, a line per goal or project, with a legend. */
export function ProgressCard() {
  const { by, setBy, series, weeks } = useStats()
  return (
    <ChartCard
      title="Progress over time"
      aside={<FilterTabs label="Progress of" options={kinds} value={by} onChange={setBy} />}
    >
      <LineChart
        series={series}
        weeks={weeks}
        label={`Progress of each ${by === 'goals' ? 'goal' : 'project'}`}
      />
      <ul className="st-legend">
        {series.map((s) => (
          <li key={s.id}>
            <span className="st-swatch" style={{ background: s.color }} />
            {s.title}
            <span className="app-muted">{s.last === undefined ? '—' : `${s.last}%`}</span>
          </li>
        ))}
        {series.length === 0 && <li className="app-muted">No progress recorded yet</li>}
      </ul>
    </ChartCard>
  )
}
