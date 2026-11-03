import { formatWeekStart } from '@/infrastructure/datetime'
import { Axes } from './Axes'
import { H, innerH, innerW, niceMax, pad, W } from './scale'
import './charts.css'

/** One stacked bar per week; `parts` name the pieces from the bottom up and `colors` paint them. */
export function StackedBarChart<K extends string>({
  data,
  parts,
  colors,
  label,
}: {
  readonly data: ReadonlyArray<{ week: string } & Record<K, number>>
  readonly parts: ReadonlyArray<K>
  readonly colors: Readonly<Record<K, string>>
  readonly label: string
}) {
  const totals = data.map((d) => parts.reduce((sum, k) => sum + d[k], 0))
  const max = niceMax(Math.max(0, ...totals))
  const slot = innerW / Math.max(data.length, 1)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="st-chart">
      <Axes weeks={data.map((d) => d.week)} max={max} />
      {data.map((d, i) => {
        let used = 0
        return (
          <g key={d.week}>
            {parts.map((k) => {
              const h = (d[k] / max) * innerH
              const y = pad.top + innerH - used - h
              used += h
              return h > 0 ? (
                <rect
                  key={k}
                  x={pad.left + i * slot + slot * 0.18}
                  y={y}
                  width={slot * 0.64}
                  height={h}
                  fill={colors[k]}
                >
                  <title>{`${formatWeekStart(d.week)}: ${d[k]} ${k}`}</title>
                </rect>
              ) : null
            })}
          </g>
        )
      })}
    </svg>
  )
}
