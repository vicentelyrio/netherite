import type { Row } from '../layout'
import { DecisionRow } from './DecisionRow'
import { laneRowStyle } from './TimelineChart.styles'
import { WorkRowLabel } from './WorkRowLabel'
import { WorkRowTrack } from './WorkRowTrack'

interface Props {
  readonly row: Row
  readonly today: string
  readonly from: string
  readonly to: string
  readonly onToggle: (projectId: string) => void
}

export function TimelineRow({ row, today, from, to, onToggle }: Props) {
  if (row.kind === 'decision') {
    return <DecisionRow decision={row.item} today={today} from={from} to={to} />
  }
  const lanes = row.kind === 'project' ? row.decisions.length : 0
  return (
    <div
      className="tl-row"
      data-kind={row.kind}
      data-lane={lanes > 0 || undefined}
      data-overdue={row.item.overdue || undefined}
      {...(lanes === 0 ? {} : { style: laneRowStyle(lanes) })}
    >
      <WorkRowLabel row={row} onToggle={onToggle} />
      <WorkRowTrack row={row} today={today} from={from} to={to} />
    </div>
  )
}
