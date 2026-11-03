import { EmptyState } from '@netherite/ui'
import { CommitCard } from '../CommitCard'
import { useDecisions } from '../DecisionProvider'
import './DecisionLanes.css'

/** One column per project, each a timeline of the commits that changed its ADRs. */
export function DecisionLanes() {
  const { lanes } = useDecisions()
  if (lanes.length === 0) {
    return (
      <EmptyState
        icon="gavel"
        title="No decisions yet"
        description="ADRs you record show up here, in a lane per project."
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
              {lane.adrs} ADRs
              {lane.chains > 0 ? ` · ${lane.chains} chain${lane.chains === 1 ? '' : 's'}` : ''}
            </span>
          </h2>
          <div className="dl-timeline">
            {lane.commits.map((commit) => (
              <CommitCard key={commit.hash} commit={commit} />
            ))}
            {lane.commits.length === 0 && <p className="app-muted">No recorded changes</p>}
          </div>
        </section>
      ))}
    </div>
  )
}
