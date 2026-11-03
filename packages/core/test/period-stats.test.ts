import { describe, expect, test } from 'vitest'
import { periodStats } from '../src/index'
import { world } from './ops-helpers'
import { files, history, now } from './progression-fixture'

describe('period stats', () => {
  test('created and done are compared with the period before', async () => {
    const w = await world(files)
    const s = periodStats(w.repo, history, { period: '30d', now })
    expect(s.from).toBe('2026-01-17')
    expect(s.to).toBe('2026-02-15')
    // TASK-00001 finished 2026-01-20; the three tasks were created 5-7 January.
    expect(s.kpis.done).toEqual({ value: 1, previous: 0 })
    expect(s.kpis.created).toEqual({ value: 0, previous: 3 })
    expect(s.kpis.cycleDays).toEqual({ value: 12.0 })
    expect(s.kpis.commits).toEqual({ value: 3, previous: 2 })
  })

  test('throughput is per week, and per month for a year', async () => {
    const w = await world(files)
    const month = periodStats(w.repo, history, { period: '30d', now })
    expect(month.throughput.reduce((n, b) => n + b.done, 0)).toBe(1)
    expect(month.throughput.find((b) => b.done === 1)?.start).toBe('2026-01-19')
    const year = periodStats(w.repo, history, { period: 'year', now })
    expect(year.throughput.find((b) => b.start === '2026-01-01')).toMatchObject({
      created: 3,
      done: 1,
    })
    expect(year.throughput.at(-1)?.start).toBe('2026-02-01')
  })

  test('goals are grouped by area with the points they gained', async () => {
    const w = await world(files)
    const s = periodStats(w.repo, history, { period: '30d', now })
    expect(s.areas).toHaveLength(1)
    // One of three tasks was done before the period began? No: it finished inside it.
    expect(s.areas[0]).toMatchObject({ area: '—', goals: 1, share: 0.33, gained: 33, idle: 0 })
    expect(s.projects[0]).toMatchObject({ id: 'PRJ-00001', done: 1, cycleDays: 12 })
  })

  test('the heat map has the commits of the last 53 weeks, and knowledge counts its states', async () => {
    const w = await world(files)
    const s = periodStats(w.repo, history, { period: 'quarter', now })
    expect(s.heat.days.reduce((n, d) => n + d.count, 0)).toBe(5)
    expect(s.heat.days.find((d) => d.date === '2026-02-03')?.count).toBe(1)
    expect(s.knowledge.decisions).toEqual({ accepted: 1 })
    expect(s.knowledge.freshness).toEqual({ fresh: 0, drifting: 0, stale: 0, notTracked: 0 })
  })
})
