import { describe, expect, test } from 'vitest'
import {
  fitWindow,
  piecesOf,
  pointOf,
  rowsOf,
  spanOf,
  type Timeline,
  ticksOf,
  unitOf,
  windowFor,
} from './layout'

const base = { progress: 0, overdue: false, planned: false, holds: [], approximate: false }
const timeline = {
  from: '2026-01-01',
  to: '2026-02-01',
  today: '2026-01-20',
  goals: [{ ...base, id: 'GOAL-1', title: 'G', status: 'progress' }],
  projects: [
    { ...base, id: 'PRJ-1', title: 'P', status: 'progress', goal: 'GOAL-1' },
    { ...base, id: 'PRJ-2', title: 'Loose', status: 'progress' },
  ],
  tasks: [{ ...base, id: 'TASK-1', title: 'T', status: 'done', project: 'PRJ-1' }],
  decisions: [{ id: 'ADR-1', title: 'A', status: 'accepted' }],
  activity: [],
  approximate: false,
} as unknown as Timeline

describe('timeline layout', () => {
  test('a window is mostly past, with room ahead', () => {
    expect(windowFor('quarter', '2026-06-01')).toEqual({ from: '2026-04-08', to: '2026-07-07' })
  })

  test('spans and points are percent of the track, clipped to it', () => {
    expect(spanOf('2026-01-11', '2026-01-21', '2026-01-01', '2026-01-31')).toEqual({
      left: expect.closeTo(33.33, 1),
      width: expect.closeTo(33.33, 1),
    })
    expect(spanOf('2025-12-01', '2026-01-16', '2026-01-01', '2026-01-31')?.left).toBe(0)
    expect(spanOf('2026-03-01', '2026-03-05', '2026-01-01', '2026-01-31')).toBeUndefined()
    expect(pointOf('2026-01-16', '2026-01-01', '2026-01-31')).toBe(50)
    expect(pointOf('2026-02-16', '2026-01-01', '2026-01-31')).toBeUndefined()
  })

  test('gridlines are Mondays, months, or quarter-years', () => {
    expect(ticksOf('quarter', '2026-01-01', '2026-01-20').map((t) => t.day)).toEqual([
      '2026-01-05',
      '2026-01-12',
      '2026-01-19',
    ])
    expect(ticksOf('year', '2026-01-15', '2026-04-10').map((t) => t.day)).toEqual([
      '2026-02-01',
      '2026-03-01',
      '2026-04-01',
    ])
    const two = ticksOf('two-years', '2025-11-01', '2026-08-01')
    expect(two.map((t) => t.day)).toEqual(['2026-01-01', '2026-04-01', '2026-07-01'])
    expect(two[0]?.major).toBe(true)
  })

  test('fit shows the dates there are, with a little room, and picks gridlines to match', () => {
    expect(fitWindow({ from: '2026-11-01', to: '2026-11-03', today: '2026-11-03' })).toEqual({
      from: '2026-10-31',
      to: '2026-11-05',
    })
    expect(fitWindow({ from: '2026-01-01', to: '2026-06-01', today: '2026-03-01' }).to).toBe(
      '2026-06-13',
    )
    expect(unitOf('fit', '2026-10-31', '2026-11-05')).toBe('day')
    expect(unitOf('fit', '2026-01-01', '2026-03-01')).toBe('week')
    expect(unitOf('fit', '2026-01-01', '2026-09-01')).toBe('month')
    expect(unitOf('fit', '2025-01-01', '2026-09-01')).toBe('quarter')
    expect(ticksOf('fit', '2026-10-31', '2026-11-02').map((t) => t.day)).toEqual([
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ])
  })

  test('rows put tasks under an open project, loose projects and decisions last', () => {
    const closed = rowsOf(timeline, { expanded: new Set(), showTasks: true, showDecisions: true })
    expect(closed.map((r) => r.item.id)).toEqual(['GOAL-1', 'PRJ-1', 'PRJ-2', 'ADR-1'])
    const open = rowsOf(timeline, {
      expanded: new Set(['PRJ-1']),
      showTasks: true,
      showDecisions: false,
    })
    expect(open.map((r) => r.item.id)).toEqual(['GOAL-1', 'PRJ-1', 'TASK-1', 'PRJ-2'])
    const hidden = rowsOf(timeline, {
      expanded: new Set(['PRJ-1']),
      showTasks: false,
      showDecisions: false,
    })
    expect(hidden.some((r) => r.kind === 'task')).toBe(false)
  })

  test('pieces: wait, active, holds, overdue; or a planned outline', () => {
    const win = ['2026-01-01', '2026-02-01'] as const
    const task = {
      created: '2026-01-02',
      started: '2026-01-05',
      due: '2026-01-10',
      overdue: true,
      planned: false,
      holds: [{ from: '2026-01-08', to: '2026-01-12' }],
    }
    expect(piecesOf(task, '2026-01-20', ...win, true).map((p) => p.kind)).toEqual([
      'wait',
      'active',
      'hold',
      'overdue',
    ])
    expect(piecesOf(task, '2026-01-20', ...win, false).map((p) => p.kind)).toEqual([
      'active',
      'hold',
      'overdue',
    ])
    const planned = {
      created: '2026-01-03',
      due: '2026-01-25',
      overdue: false,
      planned: true,
      holds: [],
    }
    expect(piecesOf(planned, '2026-01-20', ...win, true).map((p) => p.kind)).toEqual(['planned'])
  })
})
