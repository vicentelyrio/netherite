import { Link } from '@tanstack/react-router'
import { formatDay } from '@/infrastructure/datetime'
import { adrStatusLabel, useI18nContext } from '@/infrastructure/i18n'
import { daysBetween, pointOf, spanOf, type TimelineDecision } from '../layout'
import { hue, hueStyle, labelStyle, pointStyle, spanStyle } from './TimelineChart.styles'

export function DecisionRow({
  decision: d,
  today,
  from,
  to,
}: {
  readonly decision: TimelineDecision
  readonly today: string
  readonly from: string
  readonly to: string
}) {
  const { LL } = useI18nContext()
  const start = d.proposed
  const end = d.accepted ?? d.ended ?? today
  const line = start === undefined ? undefined : spanOf(start, end, from, to)
  const open = d.accepted === undefined && d.ended === undefined && start !== undefined
  const todayAt = pointOf(today, from, to)
  const markerLabel = (kind: string) =>
    kind === 'ended' ? LL.timeline.ended() : adrStatusLabel(LL, kind)
  return (
    <div className="tl-row" data-kind="decision">
      <div className="tl-label">
        <span className="tl-chevron-gap" />
        <span className="tl-diamond" style={{ background: hue('adr') }} aria-hidden="true" />
        <Link to="/items/$id" params={{ id: d.id }} className="tl-title">
          {d.title}
        </Link>
        <span className="tl-sub">{adrStatusLabel(LL, d.status)}</span>
      </div>
      <div className="tl-track" style={hueStyle('adr')}>
        {line !== undefined && (
          <Link
            to="/items/$id"
            params={{ id: d.id }}
            className="tl-piece"
            data-kind={open ? 'planned' : 'active'}
            style={spanStyle(line)}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        {[
          ['proposed', d.proposed],
          ['accepted', d.accepted],
          ['ended', d.ended],
        ].map(([kind, day]) => {
          const at = day === undefined ? undefined : pointOf(day, from, to)
          return at === undefined ? null : (
            <Link
              key={kind}
              to="/items/$id"
              params={{ id: d.id }}
              className="tl-marker"
              data-kind={kind}
              style={pointStyle(at)}
              title={`${markerLabel(kind as string)} ${formatDay(day as string)}`}
              aria-label={`${d.id} ${markerLabel(kind as string)}`}
            />
          )
        })}
        {open && start !== undefined && todayAt !== undefined && (
          <span className="tl-days" style={labelStyle(todayAt)}>
            {LL.timeline.openFor({ days: daysBetween(start, today) })}
          </span>
        )}
      </div>
    </div>
  )
}
