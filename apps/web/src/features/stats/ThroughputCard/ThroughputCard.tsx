import { useState } from 'react'
import { ChartCard } from '@/components'
import { formatDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useStats } from '../StatsProvider'
import './ThroughputCard.css'

/** Tasks created and done per week (per month for a year), side by side, with a tooltip. */
export function ThroughputCard() {
  const { LL } = useI18nContext()
  const { data, period } = useStats()
  const [at, setAt] = useState<number | undefined>(undefined)
  const peak = Math.max(1, ...data.throughput.flatMap((b) => [b.created, b.done]))
  const label = (start: string) =>
    period === 'year' ? start.slice(0, 7) : LL.stats.throughputWeek({ day: formatDay(start) })
  const hovered = at === undefined ? undefined : data.throughput[at]
  return (
    <ChartCard
      title={LL.stats.throughput()}
      aside={
        <ul className="st-legend st-legend--row">
          <li>
            <span className="st-swatch" data-kind="created" />
            {LL.stats.created()}
          </li>
          <li>
            <span className="st-swatch" data-kind="done" />
            {LL.stats.done()}
          </li>
        </ul>
      }
    >
      <div className="tp" onPointerLeave={() => setAt(undefined)}>
        {data.throughput.map((b, i) => (
          <div
            key={b.start}
            className="tp-col"
            role="img"
            aria-label={LL.stats.throughputBucket({
              start: label(b.start),
              created: b.created,
              done: b.done,
            })}
            data-active={at === i || undefined}
            onPointerEnter={() => setAt(i)}
          >
            <span
              className="tp-bar"
              data-kind="created"
              style={{ height: `${(b.created / peak) * 100}%` }}
            />
            <span
              className="tp-bar"
              data-kind="done"
              style={{ height: `${(b.done / peak) * 100}%` }}
            />
          </div>
        ))}
        {hovered !== undefined && at !== undefined && (
          <div
            className="tp-tip"
            role="tooltip"
            style={{ left: `${((at + 0.5) / data.throughput.length) * 100}%` }}
          >
            <strong>{label(hovered.start)}</strong>
            <span>{LL.stats.createdCount({ count: hovered.created })}</span>
            <span>{LL.stats.doneCount({ count: hovered.done })}</span>
          </div>
        )}
      </div>
    </ChartCard>
  )
}
