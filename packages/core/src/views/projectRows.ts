import { ItemType } from '@netherite/schema'
import type { Repo } from '../ops/repo'
import type { ScannedItem } from '../scanned-item'
import { fieldsOf } from './fieldsOf'
import { byRank, rankOf } from './rank'
import { strings } from './views.helpers'

export interface ProjectRow {
  readonly id: string
  readonly title: string
  readonly path: string
  readonly status: string | undefined
  readonly tags: ReadonlyArray<string>
  readonly progress: { readonly done: number; readonly total: number } | null
  readonly goals: ReadonlyArray<{ readonly id: string; readonly title: string }>
  readonly rank: number
}

export const projectRow = (repo: Repo, item: ScannedItem): ProjectRow => {
  const f = fieldsOf(item)
  const goals = strings(f.goals).flatMap((id) => {
    const goal = repo.index.findById(id)[0]
    return goal === undefined ? [] : [{ id, title: goal.title ?? id }]
  })
  return {
    id: item.id as string,
    title: item.title ?? (item.id as string),
    path: item.path,
    status: typeof f.status === 'string' ? f.status : undefined,
    tags: strings(f.tags),
    progress: repo.index.progress(item.path) ?? null,
    goals,
    rank: rankOf(item),
  }
}

export const projectRows = (repo: Repo): ProjectRow[] =>
  repo.index
    .items()
    .filter((i) => i.type === ItemType.Project && i.id !== undefined)
    .sort(byRank)
    .map((i) => projectRow(repo, i))
