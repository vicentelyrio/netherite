import { Icon } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { changeOf } from '../numbers'
import { useStats } from '../StatsProvider'
import './KpiCards.css'

/** The headline numbers, each against the period before. */
export function KpiCards() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  const { done, created, cycleDays, commits, staleDocs } = data.kpis
  const f = data.knowledge.freshness
  const tracked = f.fresh + f.drifting + f.stale
  const card = (
    label: string,
    value: string | number,
    caption: string,
    change: ReturnType<typeof changeOf>,
    previous: number | undefined,
    /** Whether going up is good news; `null` when neither is. */
    upIsGood: boolean | null,
    warn = false,
  ) => (
    <div className="kpi" data-warn={warn || undefined}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {change !== undefined && (
          <span
            className="kpi-change"
            title={LL.stats.kpi.previous({ value: previous ?? 0 })}
            data-tone={
              change.direction === 'same' || upIsGood === null
                ? 'flat'
                : (change.direction === 'up') === upIsGood
                  ? 'good'
                  : 'bad'
            }
          >
            {change.direction !== 'same' && (
              <Icon
                name={change.direction === 'up' ? 'arrow_upward' : 'arrow_downward'}
                size="inline"
                weight={500}
              />
            )}
            {change.text}
          </span>
        )}
      </div>
      <div className="kpi-value">
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </div>
  )
  return (
    <div className="kpi-cards">
      {card(
        LL.stats.kpi.done(),
        done.value,
        LL.stats.kpi.ofCreated({ created: created.value }),
        changeOf(done.value, done.previous),
        done.previous,
        true,
      )}
      {card(
        LL.stats.kpi.cycle(),
        cycleDays === null ? '—' : `${cycleDays.value}d`,
        LL.stats.kpi.cycleCaption(),
        cycleDays === null ? undefined : changeOf(cycleDays.value, cycleDays.previous),
        cycleDays?.previous,
        false,
      )}
      {card(
        LL.stats.kpi.commits(),
        commits.value,
        LL.stats.kpi.commitsCaption(),
        changeOf(commits.value, commits.previous),
        commits.previous,
        null,
      )}
      {card(
        LL.stats.kpi.stale(),
        staleDocs.value,
        LL.stats.kpi.ofTracked({ tracked }),
        undefined,
        undefined,
        false,
        staleDocs.value > 0,
      )}
    </div>
  )
}
