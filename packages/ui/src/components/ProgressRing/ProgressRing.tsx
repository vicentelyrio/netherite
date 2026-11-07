import { percentOf } from '../Progress'
import { useUiLabels } from '../UiLabels'
import { defaultRingSize } from './ProgressRing.constants'
import { ringMetrics, ringStyle } from './ProgressRing.styles'
import type { ProgressRingProps } from './ProgressRing.types'

export function ProgressRing({
  done,
  total,
  label,
  size = defaultRingSize,
  showCount,
}: ProgressRingProps) {
  const labels = useUiLabels()
  const percent = percentOf(done, total)
  const metrics = ringMetrics(size)
  return (
    <div
      className="nt-ring"
      role="img"
      aria-label={labels.progressOf(label ?? labels.progress, done, total)}
      style={ringStyle(size, percent)}
    >
      <div className="nt-ring-inner" style={{ inset: metrics.inset }} aria-hidden="true">
        {showCount ? (
          <span className="nt-ring-count" style={{ fontSize: metrics.count }}>
            {done}/{total}
          </span>
        ) : (
          <span className="nt-ring-text">
            <span style={{ fontSize: metrics.text }}>{percent}</span>
            <span className="nt-ring-unit">%</span>
          </span>
        )}
      </div>
    </div>
  )
}
