import { Icon } from '@netherite/ui'
import { formatDate } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { dayAt, dayIndex } from './days'
import './TimeScrubber.css'

export interface TimeScrubberProps {
  /** First and last day of the range, `YYYY-MM-DD`. The last is today. */
  readonly from: string
  readonly to: string
  /** The day shown. */
  readonly value: string
  /** Commits per week, for the histogram under the slider. */
  readonly activity: ReadonlyArray<{ readonly week: string; readonly count: number }>
  readonly playing: boolean
  readonly onChange: (day: string) => void
  readonly onPlayToggle: () => void
  readonly onToday: () => void
}

/** A date slider over an activity histogram, with play and a Today button. */
export function TimeScrubber({
  from,
  to,
  value,
  activity,
  playing,
  onChange,
  onPlayToggle,
  onToday,
}: TimeScrubberProps) {
  const { LL } = useI18nContext()
  const total = Math.max(1, dayIndex(from, to))
  const index = Math.min(total, Math.max(0, dayIndex(from, value)))
  const peak = Math.max(1, ...activity.map((w) => w.count))
  const isToday = value >= to
  return (
    <section className="nt-scrubber" aria-label={LL.graph.scrubber.label()}>
      <button
        type="button"
        className="nt-scrubber-play"
        aria-label={playing ? LL.graph.scrubber.pause() : LL.graph.scrubber.play()}
        onClick={onPlayToggle}
      >
        <Icon name={playing ? 'pause' : 'play_arrow'} size="inline" filled />
      </button>
      <div className="nt-scrubber-track">
        <div className="nt-scrubber-bars" aria-hidden="true">
          {activity.map((w) => (
            <span
              key={w.week}
              className="nt-scrubber-bar"
              data-past={w.week <= value || undefined}
              style={{
                left: `${(Math.max(0, dayIndex(from, w.week)) / total) * 100}%`,
                width: `max(3px, ${(7 / total) * 100}%)`,
                height: `${Math.max(w.count === 0 ? 0 : 12, (w.count / peak) * 100)}%`,
              }}
              title={LL.graph.scrubber.commits({ count: w.count })}
            />
          ))}
        </div>
        <input
          className="nt-scrubber-range"
          type="range"
          min={0}
          max={total}
          step={1}
          value={index}
          aria-label={LL.graph.scrubber.date()}
          aria-valuetext={formatDate(value)}
          onChange={(e) => onChange(dayAt(from, Number(e.target.value)))}
        />
      </div>
      <time className="nt-scrubber-date" dateTime={value}>
        {formatDate(value)}
      </time>
      <button type="button" className="nt-scrubber-today" disabled={isToday} onClick={onToday}>
        {LL.graph.scrubber.today()}
      </button>
    </section>
  )
}
