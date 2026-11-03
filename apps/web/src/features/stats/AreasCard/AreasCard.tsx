import { ChartCard } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useStats } from '../StatsProvider'
import './AreasCard.css'

/** The core's name for goals that have no `area`. */
const noArea = '—'

/** Goal areas: how much of each is done, the points gained in the period, achieved and idle goals. */
export function AreasCard() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  return (
    <ChartCard title={LL.stats.areas.title()}>
      {data.areas.length === 0 ? (
        <p className="app-muted">{LL.stats.areas.none()}</p>
      ) : (
        <ul className="ar-list">
          {data.areas.map((a) => (
            <li key={a.area} className="ar-row">
              <span className="ar-name">
                {a.area === noArea ? LL.stats.areas.noArea() : a.area}
              </span>
              <span className="ar-bar" aria-hidden="true">
                <span style={{ width: `${Math.round(a.share * 100)}%` }} />
              </span>
              <span className="ar-share">{Math.round(a.share * 100)}%</span>
              <span className="ar-gain" data-up={a.gained > 0 || undefined}>
                {LL.stats.areas.gained({ points: `${a.gained > 0 ? '+' : ''}${a.gained}` })}
              </span>
              <span className="ar-note">
                {LL.stats.areas.goals({ count: a.goals })}
                {a.achieved > 0 && ` · ${LL.stats.areas.achieved({ count: a.achieved })}`}
                {a.idle > 0 && ` · ${LL.stats.areas.idle({ count: a.idle })}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
