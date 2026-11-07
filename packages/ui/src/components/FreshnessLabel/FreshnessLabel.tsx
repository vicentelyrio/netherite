import { commitCount } from './commitCount'
import { freshnessText } from './FreshnessLabel.constants'
import type { FreshnessLabelProps } from './FreshnessLabel.types'
import { FreshnessMark } from './FreshnessMark'

export function FreshnessLabel({ state, commits, atLeast = false, since }: FreshnessLabelProps) {
  const count =
    (state === 'drifting' || state === 'stale') && commits !== undefined
      ? ` · ${commitCount(commits, atLeast)}`
      : ''
  const title =
    commits !== undefined && since
      ? `${commitCount(commits, atLeast)} to covered files since ${since}`
      : undefined
  return (
    <span className="nt-freshness" data-state={state} title={title}>
      <FreshnessMark state={state} />
      <span>
        {freshnessText[state]}
        {count}
      </span>
    </span>
  )
}
