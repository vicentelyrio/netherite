import { Unavailable } from '@netherite/api'
import { Banner, EmptyState } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Breadcrumbs, StatCard } from '@/components'
import { useApi } from '../lib/app-context'
import { goalsQuery, projectsQuery, statsQuery } from '../lib/queries'

export interface Point {
  readonly week: string
  readonly done: number
  readonly total: number
}

/** Done over total as a percentage, or 0 for a week with no tasks yet. */
export const percent = (p: Point) => (p.total <= 0 ? 0 : Math.round((p.done / p.total) * 100))

/** A top for a chart's axis that halves evenly: 4 stays 4, 7 becomes 8, 23 becomes 24, 180 becomes 200. */
export const niceMax = (value: number) => {
  if (value <= 4) return Math.max(value, 1)
  const step = value <= 40 ? 4 : 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / step) * step
}

const shortWeek = (week: string) =>
  new Date(`${week}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

const W = 720
const H = 220
const pad = { left: 36, right: 12, top: 12, bottom: 28 }
const innerW = W - pad.left - pad.right
const innerH = H - pad.top - pad.bottom

/** Every few weeks get a label, so the axis stays readable. */
const labelEvery = (count: number) => Math.max(1, Math.ceil(count / 8))

function Axes({
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
            {shortWeek(w)}
          </text>
        ) : null,
      )}
    </>
  )
}

/** Tasks that reached a done state, per week. */
export function Bars({
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
            <title>{`${shortWeek(d.week)}: ${d.count}`}</title>
          </rect>
        )
      })}
    </svg>
  )
}

export const adrColors = {
  proposed: '#a5a7ff',
  accepted: '#2cc27e',
  deprecated: '#f0717e',
  superseded: '#969ab8',
} as const
const adrOrder = ['proposed', 'accepted', 'deprecated', 'superseded'] as const

/** ADRs by the status they moved to, stacked per week. */
export function StackedBars({
  data,
  label,
}: {
  readonly data: ReadonlyArray<{ week: string } & Record<(typeof adrOrder)[number], number>>
  readonly label: string
}) {
  const totals = data.map((d) => adrOrder.reduce((sum, k) => sum + d[k], 0))
  const max = niceMax(Math.max(0, ...totals))
  const slot = innerW / Math.max(data.length, 1)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="st-chart">
      <Axes weeks={data.map((d) => d.week)} max={max} />
      {data.map((d, i) => {
        let used = 0
        return (
          <g key={d.week}>
            {adrOrder.map((k) => {
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
                  fill={adrColors[k]}
                >
                  <title>{`${shortWeek(d.week)}: ${d[k]} ${k}`}</title>
                </rect>
              ) : null
            })}
          </g>
        )
      })}
    </svg>
  )
}

export const lineColors = [
  '#8f91f2',
  '#3ba474',
  '#d9a646',
  '#d2a8f0',
  '#8fc3f2',
  '#f0b397',
  '#7ed6c8',
]

/** Percent of tasks done at the end of each week, a line per goal or project. */
export function Lines({
  series,
  weeks,
  label,
}: {
  readonly series: ReadonlyArray<{
    id: string
    title: string
    color: string
    points: ReadonlyArray<Point>
  }>
  readonly weeks: ReadonlyArray<string>
  readonly label: string
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="st-chart">
      <Axes weeks={weeks} max={100} unit="%" />
      {series.map((s) => {
        const byWeek = new Map(s.points.map((p) => [p.week, p]))
        const path = weeks
          .flatMap((w, i) => {
            const p = byWeek.get(w)
            return p === undefined
              ? []
              : [
                  [
                    pad.left + ((i + 0.5) / weeks.length) * innerW,
                    pad.top + innerH - (percent(p) / 100) * innerH,
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

/**
 * Stats: how work moved over time, from the git history: tasks done per week, progress of each
 * goal or project, and what happened to ADRs.
 */
export function StatsPage() {
  const api = useApi()
  const stats = useQuery(statsQuery(api))
  const goals = useQuery(goalsQuery(api))
  const projects = useQuery(projectsQuery(api))
  const [by, setBy] = useState<'goals' | 'projects'>('goals')

  if (stats.isPending) return <div className="app-page app-muted">Loading…</div>
  if (stats.isError) {
    const noGit = stats.error instanceof Unavailable
    return (
      <div className="app-page app-page--wide">
        {noGit ? (
          <EmptyState
            icon="bar_chart"
            title="Stats need git history"
            description="Progress over time is read from the commits of this repository. Put the workspace in a git repository and the charts fill in."
          />
        ) : (
          <Banner variant="danger" title="Could not load stats">
            Check that `netherite serve` is still running.
          </Banner>
        )}
      </div>
    )
  }
  const data = stats.data
  const titles = new Map([
    ...(goals.data?.goals ?? []).map((g) => [g.id, g.title] as const),
    ...(projects.data?.projects ?? []).map((p) => [p.id, p.title] as const),
  ])
  const record = data.progress[by]
  const weeks = [
    ...new Set(Object.values(record).flatMap((points) => points.map((p) => p.week))),
  ].sort()
  const series = Object.entries(record)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, points], i) => ({
      id,
      title: titles.get(id) ?? id,
      color: lineColors[i % lineColors.length] as string,
      points,
    }))
  const done = data.completions.reduce((sum, c) => sum + c.count, 0)
  const adrs = data.adrs.reduce((sum, a) => sum + a.accepted, 0)
  const best = [...data.completions].sort((a, b) => b.count - a.count)[0]

  return (
    <div className="app-page app-page--wide st-page">
      <Breadcrumbs icon="bar_chart">
        <strong>Stats</strong>
      </Breadcrumbs>
      <h1 className="app-title">Stats</h1>
      {data.partial && (
        <Banner variant="warning" title="History is cut short">
          This is a shallow clone, so the earliest weeks are missing.
        </Banner>
      )}
      <div className="st-tiles">
        <StatCard value={done} label="tasks done" />
        <StatCard
          value={best ? best.count : 0}
          label={best ? `best week · ${shortWeek(best.week)}` : 'best week'}
        />
        <StatCard value={adrs} label="ADRs accepted" />
        <StatCard value={data.completions.length} label="weeks of history" />
      </div>

      <section className="st-card" aria-label="Tasks done per week">
        <h2 className="st-h">Tasks done per week</h2>
        <Bars data={data.completions} label="Tasks done per week" />
      </section>

      <section className="st-card" aria-label="Progress over time">
        <header className="st-card-head">
          <h2 className="st-h">Progress over time</h2>
          <div className="kn-tabs" role="radiogroup" aria-label="Progress of">
            {(['goals', 'projects'] as const).map((k) => (
              <label key={k} data-on={by === k || undefined}>
                <input
                  type="radio"
                  name="st-by"
                  className="nt-visually-hidden"
                  checked={by === k}
                  onChange={() => setBy(k)}
                />
                {k === 'goals' ? 'Goals' : 'Projects'}
              </label>
            ))}
          </div>
        </header>
        <Lines
          series={series}
          weeks={weeks}
          label={`Progress of each ${by === 'goals' ? 'goal' : 'project'}`}
        />
        <ul className="st-legend">
          {series.map((s) => {
            const last = s.points.at(-1)
            return (
              <li key={s.id}>
                <span className="st-swatch" style={{ background: s.color }} />
                {s.title}
                <span className="app-muted">{last ? `${percent(last)}%` : '—'}</span>
              </li>
            )
          })}
          {series.length === 0 && <li className="app-muted">No progress recorded yet</li>}
        </ul>
      </section>

      <section className="st-card" aria-label="ADR activity">
        <header className="st-card-head">
          <h2 className="st-h">ADR activity</h2>
          <ul className="st-legend st-legend--row">
            {adrOrder.map((k) => (
              <li key={k}>
                <span className="st-swatch" style={{ background: adrColors[k] }} />
                {k}
              </li>
            ))}
          </ul>
        </header>
        <StackedBars data={data.adrs} label="ADRs by the status they moved to, per week" />
      </section>
    </div>
  )
}
