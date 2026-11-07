import { ItemType } from '@netherite/schema'
import type { AuthorSummary, History, Transition } from './history.types'

const byTime = (a: { date: string }, b: { date: string }) => Date.parse(a.date) - Date.parse(b.date)

export const authorsOf = (history: History, id: string): ReadonlyArray<AuthorSummary> =>
  history.items.get(id)?.authors ?? []

export const decisionLog = (history: History): ReadonlyArray<Transition> =>
  [...history.items.values()]
    .filter((item) => item.type === ItemType.Adr)
    .flatMap((item) => item.transitions.filter((t) => t.field === 'status'))
    .sort(byTime)

export const taskTransitions = (history: History): ReadonlyArray<Transition> =>
  [...history.items.values()]
    .filter((item) => item.type === ItemType.Task)
    .flatMap((item) => item.transitions.filter((t) => t.field === 'state'))
    .sort(byTime)
