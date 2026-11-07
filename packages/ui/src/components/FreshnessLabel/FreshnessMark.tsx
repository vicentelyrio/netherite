import { color, type FreshnessState } from '@netherite/tokens'
import { Icon } from '../Icon'
import { staleIcon } from './FreshnessLabel.constants'

export function FreshnessMark({ state }: { readonly state: FreshnessState }) {
  return (
    <span className="nt-freshness-mark" aria-hidden="true">
      {state === 'stale' ? (
        <Icon name={staleIcon} size="inline" filled style={{ color: color.freshness.stale }} />
      ) : state === 'unknown' ? null : (
        <span className="nt-freshness-dot" />
      )}
    </span>
  )
}
