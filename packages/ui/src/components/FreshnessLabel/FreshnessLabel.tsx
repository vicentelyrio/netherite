import { useUiLabels } from '../UiLabels'
import type { FreshnessLabelProps } from './FreshnessLabel.types'
import { FreshnessMark } from './FreshnessMark'

export function FreshnessLabel({ state, commits, atLeast = false, since }: FreshnessLabelProps) {
  const labels = useUiLabels()
  const count =
    (state === 'drifting' || state === 'stale') && commits !== undefined
      ? ` · ${labels.commits(commits, atLeast)}`
      : ''
  const title =
    commits !== undefined && since
      ? labels.coveredSince(labels.commits(commits, atLeast), since)
      : undefined
  return (
    <span className="nt-freshness" data-state={state} title={title}>
      <FreshnessMark state={state} />
      <span>
        {labels.freshness[state]}
        {count}
      </span>
    </span>
  )
}
