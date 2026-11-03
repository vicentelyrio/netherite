import { describe, expect, test } from 'vitest'
import { commitsByWeek, timelineOf } from '../src/index'
import { world } from './ops-helpers'
import { files, history, now } from './progression-fixture'

describe('timeline', () => {
  test('goals, projects and tasks carry their dates, holds and due dates', async () => {
    const w = await world(files)
    const tl = timelineOf(w.repo, history, { now })
    expect(tl.today).toBe('2026-02-15')
    expect(tl.from).toBe('2026-01-01')
    expect(tl.goals[0]).toMatchObject({
      id: 'GOAL-00001',
      horizon: '10 years',
      started: '2026-01-08',
    })
    expect(tl.projects[0]).toMatchObject({
      id: 'PRJ-00001',
      goal: 'GOAL-00001',
      milestone: 'Beta',
      due: '2026-03-20',
      started: '2026-01-08',
    })
    const done = tl.tasks.find((x) => x.id === 'TASK-00001')
    expect(done).toMatchObject({
      status: 'done',
      started: '2026-01-08',
      finished: '2026-01-20',
      overdue: false,
    })
    expect(tl.decisions[0]).toMatchObject({
      id: 'ADR-00001',
      proposed: '2026-01-02',
      accepted: '2026-01-09',
    })
  })

  test('overdue and planned are decided from today', async () => {
    const w = await world(files)
    const tl = timelineOf(w.repo, history, { now })
    const task = (id: string) => tl.tasks.find((x) => x.id === id)
    expect(task('TASK-00002')).toMatchObject({ overdue: true, planned: false, status: 'hold' })
    expect(task('TASK-00002')?.holds).toEqual([{ from: '2026-01-25' }])
    expect(task('TASK-00003')).toMatchObject({ overdue: false, planned: true })
    const early = timelineOf(w.repo, history, { now: '2026-02-05T12:00:00Z' })
    expect(early.tasks.find((x) => x.id === 'TASK-00002')?.overdue).toBe(false)
  })

  test('the window leaves out what does not touch it', async () => {
    const w = await world(files)
    const tl = timelineOf(w.repo, history, { from: '2026-02-01', to: '2026-02-28', now })
    expect(tl.tasks.map((x) => x.id).sort()).toEqual(['TASK-00002', 'TASK-00003'])
    expect(tl.decisions).toEqual([])
    expect(tl.projects).toHaveLength(1)
  })

  test('activity counts commits per week, empty weeks included', () => {
    const weeks = commitsByWeek(history)
    expect(weeks[0]).toEqual({ week: '2025-12-29', count: 1 })
    expect(weeks.find((x) => x.week === '2026-01-26')?.count).toBe(2)
    expect(weeks.at(-1)).toEqual({ week: '2026-02-02', count: 1 })
    expect(weeks.reduce((n, x) => n + x.count, 0)).toBe(5)
    expect(weeks).toHaveLength(6)
  })
})
