import { Link } from '@tanstack/react-router'
import { formatDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { daysBetween, pointOf, spanOf, type TimelineDecision } from '../layout'
import { laneLabelStyle, laneStyle, pointStyle, spanStyle } from './TimelineChart.styles'

export function DecisionLane({
  decision: d,
  lane,
  today,
  from,
  to,
}: {
  readonly decision: TimelineDecision
  readonly lane: number
  readonly today: string
  readonly from: string
  readonly to: string
}) {
  const { LL } = useI18nContext()
  const start = d.proposed as string
  const decided = d.accepted ?? d.ended
  const line = spanOf(start, decided ?? today, from, to)
  const at = (day: string | undefined) => (day === undefined ? undefined : pointOf(day, from, to))
  const after = at(decided ?? today)
  return (
    <div className="tl-lane" style={laneStyle(lane)}>
      {line !== undefined && (
        <span
          className="tl-lane-line"
          data-open={decided === undefined || undefined}
          style={spanStyle(line)}
        />
      )}
      {[
        ['proposed', d.proposed],
        ['accepted', d.accepted],
        ['ended', d.ended],
      ].map(([kind, day]) => {
        const x = at(day)
        return x === undefined ? null : (
          <Link
            key={kind}
            to="/items/$id"
            params={{ id: d.id }}
            className="tl-lane-marker"
            data-kind={kind}
            style={pointStyle(x)}
            title={`${d.id} ${kind} ${formatDay(day as string)}`}
            aria-label={`${d.id} ${kind}`}
          />
        )
      })}
      {after !== undefined && (
        <Link
          to="/items/$id"
          params={{ id: d.id }}
          className="tl-lane-label"
          style={laneLabelStyle(after)}
          title={d.title}
        >
          {decided === undefined
            ? `${d.id} · ${LL.timeline.openFor({ days: daysBetween(start, today) })}`
            : d.id}
        </Link>
      )}
    </div>
  )
}
