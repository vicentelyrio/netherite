import { Axes } from './Axes'
import { H, innerH, innerW, pad, W } from './scale'
import './charts.css'

export interface LineSeries {
  readonly id: string
  readonly title: string
  readonly color: string
  /** A value from 0 to 100 for the weeks the series has one. */
  readonly points: ReadonlyArray<{ readonly week: string; readonly value: number }>
}

/** A percentage over weeks, one line per series. */
export function LineChart({
  series,
  weeks,
  label,
}: {
  readonly series: ReadonlyArray<LineSeries>
  readonly weeks: ReadonlyArray<string>
  readonly label: string
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="st-chart">
      <Axes weeks={weeks} max={100} unit="%" />
      {series.map((s) => {
        const byWeek = new Map(s.points.map((p) => [p.week, p.value]))
        const path = weeks
          .flatMap((w, i) => {
            const value = byWeek.get(w)
            return value === undefined
              ? []
              : [
                  [
                    pad.left + ((i + 0.5) / weeks.length) * innerW,
                    pad.top + innerH - (value / 100) * innerH,
                  ],
                ]
          })
          .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x?.toFixed(1)},${y?.toFixed(1)}`)
          .join(' ')
        return (
          <path
            key={s.id}
            d={path}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          >
            <title>{s.title}</title>
          </path>
        )
      })}
    </svg>
  )
}
