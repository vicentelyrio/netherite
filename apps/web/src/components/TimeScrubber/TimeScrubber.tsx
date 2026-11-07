import { Icon } from '@netherite/ui'
import { formatDate } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { dayAt, dayIndex } from './days'
import './TimeScrubber.css'

export interface TimeScrubberProps {
  readonly from: string
  readonly to: string
  readonly value: string
  readonly activity: ReadonlyArray<{ readonly week: string; readonly count: number }>
  readonly playing: boolean
  readonly onChange: (day: string) => void
  readonly onPlayToggle: () => void
  readonly onToday: () => void
}

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
    <section className="scrubber" aria-label={LL.graph.scrubber.label()}>
      <button
        type="button"
        className="scrubber-play"
        aria-label={playing ? LL.graph.scrubber.pause() : LL.graph.scrubber.play()}
        onClick={onPlayToggle}
      >
        <Icon name={playing ? 'pause' : 'play_arrow'} size="inline" filled />
      </button>
      <div className="scrubber-track">
        <div className="scrubber-bars" aria-hidden="true">
          {activity.map((w) => (
            <span
              key={w.week}
              className="scrubber-bar"
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
          className="scrubber-range"
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
      <time className="scrubber-date" dateTime={value}>
        {formatDate(value)}
      </time>
      <button type="button" className="scrubber-today" disabled={isToday} onClick={onToday}>
        {LL.graph.scrubber.today()}
      </button>
    </section>
  )
}
