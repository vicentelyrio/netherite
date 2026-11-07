import { Icon } from '../Icon'
import { capitalize } from './capitalize'
import { adrIcons } from './StatusPill.constants'
import { pillStyle } from './StatusPill.styles'
import type { AdrStatusPillProps } from './StatusPill.types'

export function AdrStatusPill({ status }: AdrStatusPillProps) {
  return (
    <span className="nt-status-pill" data-value={status} style={pillStyle(`adr-${status}`)}>
      <Icon name={adrIcons[status]} size="pill" />
      {capitalize(status)}
    </span>
  )
}
