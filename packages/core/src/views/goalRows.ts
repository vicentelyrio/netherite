import { ItemType, RelationKind } from '@netherite/schema'
import { parseHorizon } from '../horizon'
import type { Repo } from '../ops/repo'
import type { ScannedItem } from '../scanned-item'
import { fieldsOf } from './fieldsOf'
import { projectRow } from './projectRows'
import { byRank, rankOf } from './rank'
import { strings } from './views.helpers'

export interface GoalRow {
  readonly id: string
  readonly title: string
  readonly path: string
  readonly status: string
  readonly area: string | undefined
  readonly due: string | undefined
  readonly created: string | undefined
  readonly horizon: string | undefined
  readonly horizonDays: number | undefined
  readonly tags: ReadonlyArray<string>
  readonly progress: { readonly done: number; readonly total: number } | null
  readonly projects: number
  readonly rank: number
}

const idOrNull = (item: ScannedItem) => (item.id === undefined ? null : item.id)

const projectsOf = (repo: Repo, goalPath: string) =>
  repo.index
    .backlinks(goalPath)
    .filter((e) => e.kind === RelationKind.BelongsTo)
    .flatMap((e) => {
      const item = repo.index.get(e.from)
      return item?.type === ItemType.Project && item.id !== undefined ? [item] : []
    })

const goalRow = (repo: Repo, item: ScannedItem): GoalRow => {
  const f = fieldsOf(item)
  const horizon =
    typeof f.horizon === 'string' && f.horizon.trim() !== '' ? f.horizon.trim() : undefined
  const parsed = horizon === undefined ? undefined : parseHorizon(horizon)
  return {
    id: item.id as string,
    title: item.title ?? (item.id as string),
    path: item.path,
    status: typeof f.status === 'string' ? f.status : 'active',
    area: typeof f.area === 'string' && f.area !== '' ? f.area : undefined,
    due: typeof f.due === 'string' ? f.due : undefined,
    created: typeof f.created === 'string' ? f.created : undefined,
    horizon,
    horizonDays: parsed === undefined || parsed.forever ? undefined : parsed.days,
    tags: strings(f.tags),
    progress: repo.index.progress(item.path) ?? null,
    projects: projectsOf(repo, item.path).length,
    rank: rankOf(item),
  }
}

export const goalRows = (repo: Repo): GoalRow[] =>
  repo.index
    .items()
    .filter((i) => i.type === ItemType.Goal && idOrNull(i) !== null)
    .map((i) => goalRow(repo, i))
    .sort((a, b) => {
      if ((a.area === undefined) !== (b.area === undefined)) return a.area === undefined ? 1 : -1
      return (
        (a.area ?? '').localeCompare(b.area ?? '') || a.rank - b.rank || a.id.localeCompare(b.id)
      )
    })

export const goalDetail = (repo: Repo, item: ScannedItem) => ({
  ...goalRow(repo, item),
  projectRows: projectsOf(repo, item.path)
    .sort(byRank)
    .map((p) => projectRow(repo, p)),
})
