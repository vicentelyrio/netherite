import { formatWeekStart } from '@/infrastructure/datetime'
import { Axes } from './Axes'
import { H, innerH, innerW, niceMax, pad, W } from './scale'
import './charts.css'

/** One bar per week. */
export function BarChart({
  data,
  label,
}: {
  readonly data: ReadonlyArray<{ week: string; count: number }>
  readonly label: string
}) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.count)))
  const slot = innerW / Math.max(data.length, 1)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="st-chart">
      <Axes weeks={data.map((d) => d.week)} max={max} />
      {data.map((d, i) => {
        const h = (d.count / max) * innerH
        return (
          <rect
            key={d.week}
            x={pad.left + i * slot + slot * 0.18}
            y={pad.top + innerH - h}
            width={slot * 0.64}
            height={h}
            rx={3}
            className="st-bar"
          >
            <title>{`${formatWeekStart(d.week)}: ${d.count}`}</title>
          </rect>
        )
      })}
    </svg>
  )
}
