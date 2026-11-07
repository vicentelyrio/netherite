import { AdrStatusPill } from './AdrStatusPill'
import type { StatusPillProps } from './StatusPill.types'
import { TaskStatePill } from './TaskStatePill'

export function StatusPill(props: StatusPillProps) {
  return props.kind === 'adr' ? (
    <AdrStatusPill status={props.status} />
  ) : (
    <TaskStatePill state={props.state} category={props.category} />
  )
}
