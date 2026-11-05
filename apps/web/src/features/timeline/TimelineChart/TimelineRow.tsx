import { Icon, StatusGlyph } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { formatDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { daysBetween, piecesOf, pointOf, type Row, spanOf, type TimelineDecision } from '../layout'

interface Props {
  readonly row: Row
  readonly today: string
  readonly from: string
  readonly to: string
  readonly onToggle: (projectId: string) => void
}

const hue = (type: string) => `var(--nt-color-type-${type})`

/** One row: who it is on the left, its life on the track on the right. */
export function TimelineRow({ row, today, from, to, onToggle }: Props) {
  const { LL } = useI18nContext()

  if (row.kind === 'decision') {
    const d = row.item
    const start = d.proposed
    const end = d.accepted ?? d.ended ?? today
    const line = start === undefined ? undefined : spanOf(start, end, from, to)
    const open = d.accepted === undefined && d.ended === undefined && start !== undefined
    return (
      <div className="tl-row" data-kind="decision">
        <div className="tl-label">
          <span className="tl-chevron-gap" />
          <span className="tl-diamond" style={{ background: hue('adr') }} aria-hidden="true" />
          <Link to="/items/$id" params={{ id: d.id }} className="tl-title">
            {d.title}
          </Link>
          <span className="tl-sub">{d.status}</span>
        </div>
        <div className="tl-track" style={{ '--tl-hue': hue('adr') } as React.CSSProperties}>
          {line !== undefined && (
            <Link
              to="/items/$id"
              params={{ id: d.id }}
              className="tl-piece"
              data-kind={open ? 'planned' : 'active'}
              style={{ left: `${line.left}%`, width: `${line.width}%` }}
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
                style={{ left: `${at}%` }}
                title={`${kind} ${formatDay(day as string)}`}
                aria-label={`${d.id} ${kind}`}
              />
            )
          })}
          {open && start !== undefined && pointOf(today, from, to) !== undefined && (
            <span className="tl-days" style={{ left: `calc(${pointOf(today, from, to)}% + 8px)` }}>
              {LL.timeline.openFor({ days: daysBetween(start, today) })}
            </span>
          )}
        </div>
      </div>
    )
  }

  const item = row.item
  const type = row.kind
  const pieces = piecesOf(item, today, from, to, type === 'task')
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
    row.kind === 'project' && item.status !== 'done' && dueAt !== undefined && left !== undefined
      ? left >= 0
        ? LL.timeline.dueIn({ date: formatDay(item.due as string), days: left })
        : undefined
      : undefined
  return (
    <div
      className="tl-row"
      data-kind={type}
      data-lane={decisions.length > 0 || undefined}
      data-overdue={item.overdue || undefined}
      style={
        decisions.length === 0
          ? undefined
          : ({
              '--tl-row': `${36 + 20 * decisions.length}px`,
              '--tl-shift': `${10 * decisions.length}px`,
            } as React.CSSProperties)
      }
    >
      <div className={`tl-label tl-indent-${type}`}>
        {row.kind === 'project' ? (
          <button
            type="button"
            className="tl-chevron"
            aria-expanded={row.expanded}
            aria-label={row.expanded ? LL.timeline.hideTasks() : LL.timeline.showTasks()}
            disabled={row.tasks === 0}
            onClick={() => onToggle(row.item.id)}
          >
            <Icon name={row.expanded ? 'expand_more' : 'chevron_right'} size="inline" />
          </button>
        ) : (
          <span className="tl-chevron-gap" />
        )}
        <StatusGlyph
          type={type}
          status={item.status}
          progress={item.progress}
          size={type === 'task' ? 10 : 14}
        />
        {row.kind === 'goal' ? (
          <Link to="/goals/$id" params={{ id: item.id }} className="tl-title">
            {item.title}
          </Link>
        ) : row.kind === 'project' ? (
          <Link to="/projects/$id" params={{ id: item.id }} className="tl-title">
            {item.title}
          </Link>
        ) : (
          <Link
            to="/projects/$id"
            params={{ id: row.item.project ?? '' }}
            search={{ task: item.id }}
            className="tl-title"
          >
            {item.title}
          </Link>
        )}
        {item.overdue && <span className="tl-flag">{LL.timeline.overdue()}</span>}
        {row.kind === 'goal' && (
          <span className="tl-share">{Math.round(item.progress * 100)}%</span>
        )}
        {row.kind === 'project' && (
          <span className="tl-sub">{row.tasks === 0 ? '' : `${row.done}/${row.tasks}`}</span>
        )}
      </div>
      <div className="tl-track" style={{ '--tl-hue': hue(type) } as React.CSSProperties}>
        {pieces.map((p) => {
          const props = {
            className: 'tl-piece',
            'data-kind': p.kind,
            'data-done': (p.kind === 'active' && item.status === 'done') || undefined,
            style: { left: `${p.span.left}%`, width: `${p.span.width}%` },
            title:
              p.kind === 'hold'
                ? LL.timeline.onHold()
                : p.kind === 'planned'
                  ? LL.timeline.planned()
                  : undefined,
          }
          // The bar of the item is a way into it; the thin waiting, hold and overdue bars are not.
          if (p.kind !== 'active' && p.kind !== 'planned') {
            return <span key={`${p.kind}-${p.span.left}`} {...props} />
          }
          return row.kind === 'goal' ? (
            <Link
              key={`${p.kind}-${p.span.left}`}
              to="/goals/$id"
              params={{ id: item.id }}
              aria-hidden="true"
              tabIndex={-1}
              {...props}
            />
          ) : row.kind === 'project' ? (
            <Link
              key={`${p.kind}-${p.span.left}`}
              to="/projects/$id"
              params={{ id: item.id }}
              aria-hidden="true"
              tabIndex={-1}
              {...props}
            />
          ) : (
            <Link
              key={`${p.kind}-${p.span.left}`}
              to="/projects/$id"
              params={{ id: row.item.project ?? '' }}
              search={{ task: item.id }}
              aria-hidden="true"
              tabIndex={-1}
              {...props}
            />
          )
        })}
        {dueAt !== undefined && item.due !== undefined && (
          <span
            className="tl-due"
            data-overdue={item.overdue || undefined}
            style={{ left: `${dueAt}%` }}
            title={LL.timeline.due({ date: formatDay(item.due) })}
          />
        )}
        {milestone !== undefined && dueAt !== undefined && (
          <span
            className="tl-milestone"
            style={{ left: `${dueAt}%` }}
            title={LL.timeline.milestone({ name: milestone })}
          >
            <Icon name="flag" size="pill" filled />
          </span>
        )}
        {finishedAt !== undefined && (
          <span className="tl-check" style={{ left: `${finishedAt}%` }}>
            <Icon name="check" size="pill" weight={500} />
          </span>
        )}
        {dueLabel !== undefined && dueAt !== undefined && (
          <span className="tl-days" style={{ left: `calc(${dueAt}% + 8px)` }}>
            {dueLabel}
          </span>
        )}
        {decisions.map((d, lane) => (
          <DecisionLane key={d.id} decision={d} lane={lane} today={today} from={from} to={to} />
        ))}
        {type === 'task' && lived !== undefined && barEnd !== undefined && (
          <span className="tl-days" style={{ left: `calc(${barEnd}% + 8px)` }}>
            {LL.timeline.days({ days: lived })}
          </span>
        )}
      </div>
    </div>
  )
}

/** A decision of a project: proposed as a ring, accepted as a filled diamond, joined by a line. */
function DecisionLane({
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
    <div className="tl-lane" style={{ '--lane': lane } as React.CSSProperties}>
      {line !== undefined && (
        <span
          className="tl-lane-line"
          data-open={decided === undefined || undefined}
          style={{ left: `${line.left}%`, width: `${line.width}%` }}
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
            style={{ left: `${x}%` }}
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
          style={{ left: `calc(${after}% + 10px)` }}
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
