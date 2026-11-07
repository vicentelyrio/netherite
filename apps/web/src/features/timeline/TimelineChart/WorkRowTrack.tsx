import { Icon } from '@netherite/ui'
import { formatDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { daysBetween, piecesOf, pointOf } from '../layout'
import { DecisionLane } from './DecisionLane'
import { hueStyle, labelStyle, pointStyle, spanStyle } from './TimelineChart.styles'
import { WorkLink, type WorkRow } from './WorkLink'

export function WorkRowTrack({
  row,
  today,
  from,
  to,
}: {
  readonly row: WorkRow
  readonly today: string
  readonly from: string
  readonly to: string
}) {
  const { LL } = useI18nContext()
  const item = row.item
  const pieces = piecesOf(item, today, from, to, row.kind === 'task')
  const bar = pieces.find((p) => p.kind === 'active')
  const dueAt = item.due === undefined ? undefined : pointOf(item.due, from, to)
  const milestone = row.kind === 'project' ? row.item.milestone : undefined
  const finishedAt =
    item.status === 'done' && item.finished !== undefined
      ? pointOf(item.finished, from, to)
      : undefined
  const lived =
    item.started === undefined ? undefined : daysBetween(item.started, item.finished ?? today)
  const barEnd = bar === undefined ? undefined : bar.span.left + bar.span.width
  const decisions = row.kind === 'project' ? row.decisions : []
  const left = item.due === undefined ? undefined : daysBetween(today, item.due)
  const dueLabel =
    row.kind === 'project' &&
    item.status !== 'done' &&
    dueAt !== undefined &&
    left !== undefined &&
    left >= 0
      ? LL.timeline.dueIn({ date: formatDay(item.due as string), days: left })
      : undefined
  return (
    <div className="tl-track" style={hueStyle(row.kind)}>
      {pieces.map((p) => {
        const props = {
          className: 'tl-piece',
          'data-kind': p.kind,
          'data-done': (p.kind === 'active' && item.status === 'done') || undefined,
          style: spanStyle(p.span),
          title:
            p.kind === 'hold'
              ? LL.timeline.onHold()
              : p.kind === 'planned'
                ? LL.timeline.planned()
                : undefined,
        }
        const key = `${p.kind}-${p.span.left}`
        if (p.kind !== 'active' && p.kind !== 'planned') return <span key={key} {...props} />
        return <WorkLink key={key} row={row} aria-hidden="true" tabIndex={-1} {...props} />
      })}
      {dueAt !== undefined && item.due !== undefined && (
        <span
          className="tl-due"
          data-overdue={item.overdue || undefined}
          style={pointStyle(dueAt)}
          title={LL.timeline.due({ date: formatDay(item.due) })}
        />
      )}
      {milestone !== undefined && dueAt !== undefined && (
        <span
          className="tl-milestone"
          style={pointStyle(dueAt)}
          title={LL.timeline.milestone({ name: milestone })}
        >
          <Icon name="flag" size="pill" filled />
        </span>
      )}
      {finishedAt !== undefined && (
        <span className="tl-check" style={pointStyle(finishedAt)}>
          <Icon name="check" size="pill" weight={500} />
        </span>
      )}
      {dueLabel !== undefined && dueAt !== undefined && (
        <span className="tl-days" style={labelStyle(dueAt)}>
          {dueLabel}
        </span>
      )}
      {decisions.map((d, lane) => (
        <DecisionLane key={d.id} decision={d} lane={lane} today={today} from={from} to={to} />
      ))}
      {row.kind === 'task' && lived !== undefined && barEnd !== undefined && (
        <span className="tl-days" style={labelStyle(barEnd)}>
          {LL.timeline.days({ days: lived })}
        </span>
      )}
    </div>
  )
}
