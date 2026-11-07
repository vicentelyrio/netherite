import { Icon } from '../Icon'
import { capitalize } from './capitalize'
import { stateIcons } from './StatusPill.constants'
import { pillStyle } from './StatusPill.styles'
import type { TaskStatePillProps } from './StatusPill.types'

export function TaskStatePill({ state, category }: TaskStatePillProps) {
  return (
    <span
      className="nt-status-pill"
      data-kind="state"
      data-value={category}
      style={pillStyle(`state-${category}`)}
    >
      <Icon name={stateIcons[category]} size="pill" />
      {capitalize(state)}
    </span>
  )
}
