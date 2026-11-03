import { EmptyState } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { CommitCard } from '../CommitCard'
import { useDecisions } from '../DecisionProvider'
import './DecisionLanes.css'

/** One column per project, each a timeline of the commits that changed its ADRs. */
export function DecisionLanes() {
  const { LL } = useI18nContext()
  const { lanes } = useDecisions()
  if (lanes.length === 0) {
    return (
      <EmptyState
        icon="gavel"
        title={LL.decisions.empty.title()}
        description={LL.decisions.empty.text()}
      />
    )
  }
  return (
    <div
      className="dl-lanes"
      style={{ ['--lanes' as string]: lanes.length === 1 ? 2 : lanes.length }}
    >
      {lanes.map((lane) => (
        <section key={lane.project} className="dl-lane" aria-label={lane.project}>
          <h2 className="dl-lane-head">
            <span className="dl-lane-dot" />
            {lane.project}
            <span className="app-muted">
              {LL.decisions.adrs({ count: lane.adrs })}
              {lane.chains > 0 ? ` · ${LL.decisions.chains({ count: lane.chains })}` : ''}
            </span>
          </h2>
          <div className="dl-timeline">
            {lane.commits.map((commit) => (
              <CommitCard key={commit.hash} commit={commit} />
            ))}
            {lane.commits.length === 0 && <p className="app-muted">{LL.decisions.noChanges()}</p>}
          </div>
        </section>
      ))}
    </div>
  )
}
