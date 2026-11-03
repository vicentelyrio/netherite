import { formatWeekStart } from '@/infrastructure/datetime'
import { H, innerH, innerW, pad, W } from './scale'
import './charts.css'

/** Every few weeks get a label, so the axis stays readable. */
const labelEvery = (count: number) => Math.max(1, Math.ceil(count / 8))

/** Grid lines and tick labels for a chart of weeks. */
export function Axes({
  weeks,
  max,
  unit,
}: {
  readonly weeks: ReadonlyArray<string>
  readonly max: number
  readonly unit?: string
}) {
  const every = labelEvery(weeks.length)
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t))
  return (
    <>
      {ticks.map((t) => {
        const y = pad.top + innerH - (t / max) * innerH
        return (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} className="st-grid" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" className="st-tick">
              {t}
              {unit}
            </text>
          </g>
        )
      })}
      {weeks.map((w, i) =>
        i % every === 0 ? (
          <text
            key={w}
            x={pad.left + ((i + 0.5) / weeks.length) * innerW}
            y={H - 8}
            textAnchor="middle"
            className="st-tick"
          >
            {formatWeekStart(w)}
          </text>
        ) : null,
      )}
    </>
  )
}
