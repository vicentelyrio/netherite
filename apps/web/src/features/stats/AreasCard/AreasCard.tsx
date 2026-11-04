import { Icon } from '@netherite/ui'
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
  const named = (a: string) => (a === noArea ? LL.stats.areas.noArea() : a)
  const footer = data.areas.flatMap((a) => [
    ...a.achievedGoals.map((title) => ({ kind: 'achieved' as const, title, area: named(a.area) })),
    ...a.idleGoals.map((title) => ({ kind: 'idle' as const, title, area: named(a.area) })),
  ])
  return (
    <ChartCard title={LL.stats.areas.title()} subtitle={LL.stats.areas.subtitle()}>
      {data.areas.length === 0 ? (
        <p className="app-muted">{LL.stats.areas.none()}</p>
      ) : (
        <ul className="ar-list">
          {data.areas.map((a) => {
            const share = Math.round(a.share * 100)
            // What was done before the period, then what the period added.
            const gained = Math.max(0, Math.min(a.gained, share))
            return (
              <li key={a.area} className="ar-row">
                <div className="ar-head">
                  <span className="ar-name">{named(a.area)}</span>
                  <span className="ar-goals">{LL.stats.areas.goals({ count: a.goals })}</span>
                  <span className="ar-fill" />
                  <span className="ar-gain" data-up={a.gained > 0 || undefined}>
                    {LL.stats.areas.gained({ points: `${a.gained > 0 ? '+' : ''}${a.gained}` })}
                  </span>
                  <span className="ar-share">{share}%</span>
                </div>
                <span className="ar-bar" aria-hidden="true">
                  <span className="ar-base" style={{ width: `${share - gained}%` }} />
                  <span className="ar-add" style={{ width: `${gained}%` }} />
                </span>
                <ul className="ar-goal-rows">
                  {a.goalRows.map((g) => (
                    <li key={g.title}>
                      <span className="ar-goal-title">{g.title}</span>
                      <span className="ar-goal-bar" aria-hidden="true">
                        <span style={{ width: `${Math.round(g.share * 100)}%` }} />
                      </span>
                      <span className="ar-goal-pct">{Math.round(g.share * 100)}%</span>
                      <span className="ar-goal-gain" data-up={g.gained > 0 || undefined}>
                        {g.gained > 0 ? `+${g.gained}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      )}
      {footer.length > 0 && (
        <ul className="ar-foot">
          {footer.map((f) => (
            <li key={`${f.kind}-${f.title}`}>
              <Icon
                name={f.kind === 'achieved' ? 'check_circle' : 'pause_circle'}
                size="inline"
                filled={f.kind === 'achieved'}
              />
              <span className="ar-foot-title">{f.title}</span>
              <span className="ar-foot-note">
                {f.kind === 'achieved'
                  ? LL.stats.areas.achievedIn({ area: f.area })
                  : LL.stats.areas.idleIn({ area: f.area })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
