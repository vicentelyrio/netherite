import { Icon } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { ChartCard } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useStats } from '../StatsProvider'
import './KnowledgeCard.css'

const order = ['fresh', 'drifting', 'stale', 'notTracked'] as const

/** How fresh the docs are, and how many decisions are in each status. */
export function KnowledgeCard() {
  const { LL } = useI18nContext()
  const { data } = useStats()
  const f = data.knowledge.freshness
  const total = order.reduce((n, k) => n + f[k], 0)
  const names = {
    fresh: LL.stats.knowledge.fresh(),
    drifting: LL.stats.knowledge.drifting(),
    stale: LL.stats.knowledge.stale(),
    notTracked: LL.stats.knowledge.notTracked(),
  }
  const decisions = Object.entries(data.knowledge.decisions).sort(([a], [b]) => a.localeCompare(b))
  return (
    <ChartCard
      title={LL.stats.knowledge.title()}
      aside={
        <Link to="/knowledge" className="kn-open">
          {LL.stats.knowledge.open()}
        </Link>
      }
    >
      <div className="st-kbar" role="img" aria-label={LL.stats.knowledge.label()}>
        {order.map((k) =>
          f[k] === 0 ? null : (
            <span
              key={k}
              data-kind={k}
              style={{ width: `${(f[k] / Math.max(1, total)) * 100}%` }}
              title={`${names[k]}: ${f[k]}`}
            />
          ),
        )}
      </div>
      <ul className="kn-legend">
        {order.map((k) => (
          <li key={k}>
            {k === 'stale' ? (
              <Icon name="warning" size={13} filled />
            ) : (
              <span className="kn-swatch" data-kind={k} />
            )}
            {names[k]} <strong>{f[k]}</strong>
          </li>
        ))}
      </ul>
      <h3 className="kn-h">{LL.stats.knowledge.decisions()}</h3>
      <ul className="kn-pills">
        {decisions.map(([status, count]) => (
          <li key={status} className="kn-pill" data-status={status}>
            {count} {status}
          </li>
        ))}
      </ul>
      {data.knowledge.undocumented.length > 0 && (
        <>
          <h3 className="kn-h">{LL.stats.knowledge.undocumented()}</h3>
          <ul className="kn-code">
            {data.knowledge.undocumented.map((u) => (
              <li key={u.path}>
                <code title={u.path}>{u.path}</code>
                <span>{LL.stats.knowledge.undocumentedCount({ count: u.commits })}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ChartCard>
  )
}
