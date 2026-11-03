import { useState } from 'react'
import { ChartCard } from '@/components'
import { addDays, formatDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useStats } from '../StatsProvider'
import './ThroughputCard.css'

/** Tasks created and done per week (per month for a year), side by side, with a tooltip. */
export function ThroughputCard() {
  const { LL } = useI18nContext()
  const { data, period } = useStats()
  const [at, setAt] = useState<number | undefined>(undefined)
  const top = Math.max(1, ...data.throughput.flatMap((b) => [b.created, b.done]))
  // The axis tops out at a round number so the gridlines mean something.
  const peak = top <= 4 ? 4 : top <= 10 ? 10 : Math.ceil(top / 10) * 10
  const label = (start: string) =>
    period === 'year'
      ? start.slice(0, 7)
      : LL.stats.throughputWeek({ from: formatDay(start), to: formatDay(addDays(start, 6)) })
  const hovered = at === undefined ? undefined : data.throughput[at]
  return (
    <ChartCard
      title={LL.stats.throughput()}
      subtitle={period === 'year' ? LL.stats.throughputSub.month() : LL.stats.throughputSub.week()}
      aside={
        <ul className="st-legend st-legend--row">
          <li>
            <span className="st-swatch" data-kind="done" />
            {LL.stats.done()}
          </li>
          <li>
            <span className="st-swatch" data-kind="created" />
            {LL.stats.created()}
          </li>
        </ul>
      }
    >
      <div className="tp-wrap">
        <div className="tp-y" aria-hidden="true">
          <span style={{ top: -8 }}>{peak}</span>
          <span style={{ top: 102 }}>{peak / 2}</span>
          <span style={{ top: 212 }}>0</span>
        </div>
        <div className="tp" onPointerLeave={() => setAt(undefined)}>
          <span className="tp-line" data-kind="dashed" style={{ top: 0 }} aria-hidden="true" />
          <span className="tp-line" data-kind="dashed" style={{ top: 110 }} aria-hidden="true" />
          <span className="tp-line" data-kind="base" style={{ top: 220 }} aria-hidden="true" />
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
          <ol className="tp-axis" aria-hidden="true">
            {data.throughput.map((b) => (
              <li key={b.start}>{period === 'year' ? b.start.slice(5, 7) : formatDay(b.start)}</li>
            ))}
          </ol>
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
      </div>
    </ChartCard>
  )
}
