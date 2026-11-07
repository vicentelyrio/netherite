import { settingDefaults } from '@netherite/schema'
import type { Repo } from '../ops/repo'
import type { ScannedItem } from '../scanned-item'
import { fieldsOf } from './fieldsOf'

export interface ItemSummary {
  readonly id: string | undefined
  readonly type: string | undefined
  readonly title: string | undefined
  readonly path: string
  readonly status?: string
  readonly state?: string
  readonly project?: string
  readonly labels?: ReadonlyArray<unknown>
}

export const itemSummary = (item: ScannedItem): ItemSummary => {
  const f = fieldsOf(item)
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    path: item.path,
    ...(typeof f.status === 'string' ? { status: f.status } : {}),
    ...(typeof f.state === 'string' ? { state: f.state } : {}),
    ...(typeof f.project === 'string' ? { project: f.project } : {}),
    ...(Array.isArray(f.labels) ? { labels: f.labels } : {}),
  }
}

export interface ItemFilter {
  readonly status?: string | undefined
  readonly project?: string | undefined
  readonly tag?: string | undefined
}

export const matchesFilter = (item: ScannedItem, filter: ItemFilter) => {
  const f = fieldsOf(item)
  if (filter.status !== undefined && f.status !== filter.status && f.state !== filter.status)
    return false
  if (
    filter.project !== undefined &&
    f.project !== filter.project &&
    !(Array.isArray(f.goals) && f.goals.includes(filter.project))
  )
    return false
  if (filter.tag !== undefined) {
    const tags = [
      ...(Array.isArray(f.tags) ? f.tags : []),
      ...(Array.isArray(f.labels) ? f.labels : []),
    ]
    if (!tags.includes(filter.tag)) return false
  }
  return true
}

export interface ListOptions extends ItemFilter {
  readonly type?: string | undefined
  readonly limit?: number
  readonly offset?: number
}

export const listItems = (repo: Repo, options: ListOptions = {}) => {
  const limit = options.limit ?? settingDefaults.queries.listLimit
  const offset = options.offset ?? 0
  const all = repo.index
    .items()
    .filter(
      (item) =>
        (options.type === undefined || item.type === options.type) && matchesFilter(item, options),
    )
    .sort((a, b) => (a.id ?? a.path).localeCompare(b.id ?? b.path))
  return { total: all.length, offset, items: all.slice(offset, offset + limit).map(itemSummary) }
}
