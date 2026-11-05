import { Link } from '@tanstack/react-router'
import { ChartCard } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useStats } from '../StatsProvider'
import './ProjectsCard.css'

/** Tasks done per project in the period, with the median time they took. */
export function ProjectsCard() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  const peak = Math.max(1, ...data.projects.map((p) => p.done))
  const shown = data.projects.filter((p) => p.done > 0)
  return (
    <ChartCard title={LL.stats.projects.title()}>
      {shown.length === 0 ? (
        <p className="app-muted">{LL.stats.projects.none()}</p>
      ) : (
        <ul className="pj-list">
          {shown.map((p) => (
            <li key={p.id} className="pj-row">
              <Link to="/projects/$id" params={{ id: p.id }} className="pj-name">
                <span className="pj-dot" aria-hidden="true" />
                <span className="pj-title">{p.title}</span>
              </Link>
              <span className="pj-bar" aria-hidden="true">
                <span style={{ width: `${(p.done / peak) * 100}%` }} />
              </span>
              <span className="pj-count">{p.done}</span>
              <span className="pj-cycle">
                {p.cycleDays === null ? '' : LL.stats.projects.median({ days: p.cycleDays })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
