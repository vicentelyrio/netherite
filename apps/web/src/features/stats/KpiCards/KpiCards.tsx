import { StatCard } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { changeOf } from '../numbers'
import { useStats } from '../StatsProvider'
import './KpiCards.css'

/** The headline numbers, each against the period before. */
export function KpiCards() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  const { done, created, cycleDays, commits, staleDocs } = data.kpis
  const prev = LL.stats.kpi.previous
  const card = (
    value: string | number,
    label: string,
    change: ReturnType<typeof changeOf>,
    previous: number | undefined,
    /** Whether going up is good news. */
    upIsGood: boolean | null,
  ) => (
    <StatCard
      value={value}
      label={label}
      note={
        change === undefined ? undefined : (
          <span
            className="kpi-change"
            data-tone={
              change.direction === 'same' || upIsGood === null
                ? 'flat'
                : (change.direction === 'up') === upIsGood
                  ? 'good'
                  : 'bad'
            }
          >
            {change.text} <span className="kpi-prev">{prev({ value: previous ?? 0 })}</span>
          </span>
        )
      }
    />
  )
  return (
    <div className="kpi-cards">
      {card(
        done.value,
        LL.stats.kpi.done({ created: created.value }),
        changeOf(done.value, done.previous),
        done.previous,
        true,
      )}
      {card(
        cycleDays === null ? '—' : `${cycleDays.value}d`,
        LL.stats.kpi.cycle(),
        cycleDays === null ? undefined : changeOf(cycleDays.value, cycleDays.previous),
        cycleDays?.previous,
        false,
      )}
      {card(
        commits.value,
        LL.stats.kpi.commits(),
        changeOf(commits.value, commits.previous),
        commits.previous,
        null,
      )}
      {card(staleDocs.value, LL.stats.kpi.stale(), undefined, undefined, false)}
    </div>
  )
}
