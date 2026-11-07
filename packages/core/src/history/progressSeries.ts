import { ItemType } from '@netherite/schema'
import type { FieldValue, History, ItemHistory } from './history.types'
import { addDays, utcDay, type WeekRange, weeksBetween } from './weeks'

export interface ProgressPoint {
  readonly week: string
  readonly done: number
  readonly total: number
}

export interface ProgressSeries {
  readonly projects: ReadonlyMap<string, ReadonlyArray<ProgressPoint>>
  readonly goals: ReadonlyMap<string, ReadonlyArray<ProgressPoint>>
}

const valueAt = (item: ItemHistory, field: string, before: number): FieldValue => {
  let value: FieldValue
  for (const t of item.transitions) {
    if (t.field !== field) continue
    if (Date.parse(t.date) >= before) break
    value = t.to
  }
  return value
}

export const progressSeries = (
  history: History,
  doneStates: ReadonlySet<string>,
  range: WeekRange = {},
): ProgressSeries => {
  const items = [...history.items.values()]
  const stamps = items.flatMap((i) => [
    ...i.transitions.map((t) => utcDay(t.date)),
    ...(i.deletedAt ? [utcDay(i.deletedAt)] : []),
  ])
  const from =
    range.from ??
    stamps.reduce<string | undefined>((a, b) => (a === undefined || b < a ? b : a), undefined)
  const to =
    range.to ??
    stamps.reduce<string | undefined>((a, b) => (a === undefined || b > a ? b : a), undefined)
  const projects = new Map<string, ProgressPoint[]>()
  const goals = new Map<string, ProgressPoint[]>()
  if (from === undefined || to === undefined) return { projects, goals }

  const tasks = items.filter((i) => i.type === ItemType.Task)
  const projectItems = items.filter((i) => i.type === ItemType.Project)
  const point = (
    series: Map<string, ProgressPoint[]>,
    id: string,
    week: string,
    done: number,
    total: number,
  ) => {
    const list = series.get(id) ?? []
    list.push({ week, done, total })
    series.set(id, list)
  }

  for (const week of weeksBetween(from, to)) {
    const end = Date.parse(`${addDays(week, 7)}T00:00:00Z`)
    const perProject = new Map<string, { done: number; total: number }>()
    for (const task of tasks) {
      const born = task.created
        ? Date.parse(task.created.date)
        : task.transitions[0]
          ? Date.parse(task.transitions[0].date)
          : undefined
      if (born === undefined || born >= end) continue
      if (task.deletedAt !== undefined && Date.parse(task.deletedAt) < end) continue
      const project = valueAt(task, 'project', end)
      if (typeof project !== 'string') continue
      const state = valueAt(task, 'state', end)
      const row = perProject.get(project) ?? { done: 0, total: 0 }
      row.total++
      if (typeof state === 'string' && doneStates.has(state)) row.done++
      perProject.set(project, row)
    }
    const perGoal = new Map<string, { done: number; total: number }>()
    for (const [project, row] of perProject) {
      point(projects, project, week, row.done, row.total)
      const item = projectItems.find((p) => p.id === project)
      const linked = item === undefined ? undefined : valueAt(item, 'goals', end)
      for (const goal of Array.isArray(linked) ? linked : []) {
        const sum = perGoal.get(goal) ?? { done: 0, total: 0 }
        sum.done += row.done
        sum.total += row.total
        perGoal.set(goal, sum)
      }
    }
    for (const [goal, sum] of perGoal) point(goals, goal, week, sum.done, sum.total)
  }
  return { projects, goals }
}
