import { ItemType, RelationKind, StateCategoryName } from '@netherite/schema'
import type { Repo } from '../ops/repo'
import type { ScannedItem } from '../scanned-item'
import { fieldsOf } from './fieldsOf'
import { projectRow } from './projectRows'
import { byRank, rankOf } from './rank'
import { strings } from './views.helpers'

export interface BoardCard {
  readonly id: string
  readonly title: string
  readonly path: string
  readonly state: string
  readonly labels: ReadonlyArray<string>
  readonly assignees: ReadonlyArray<string>
  readonly due: string | undefined
  readonly checklist: { readonly done: number; readonly total: number } | null
  readonly waitingOn: ReadonlyArray<{ readonly id: string; readonly title: string }>
  readonly rank: number
}

export interface BoardColumn {
  readonly name: string
  readonly category: string
}

export interface BoardItem {
  readonly id: string
  readonly type: string
  readonly title: string
}

const taskCard = (repo: Repo, item: ScannedItem, doneStates: ReadonlySet<string>): BoardCard => {
  const f = fieldsOf(item)
  const waitingOn = strings(f.depends_on).flatMap((id) => {
    const dep = repo.index.findById(id)[0]
    if (dep === undefined) return []
    const state = fieldsOf(dep).state
    return typeof state === 'string' && doneStates.has(state)
      ? []
      : [{ id, title: dep.title ?? id }]
  })
  return {
    id: item.id as string,
    title: item.title ?? (item.id as string),
    path: item.path,
    state: typeof f.state === 'string' ? f.state : '',
    labels: strings(f.labels),
    assignees: strings(f.assignees),
    due: typeof f.due === 'string' ? f.due : undefined,
    checklist: repo.index.progress(item.path) ?? null,
    waitingOn,
    rank: rankOf(item),
  }
}

export const boardOf = (repo: Repo, project: ScannedItem) => {
  const states = repo.workspace.config.states
  const doneStates = new Set(
    states.filter((s) => s.category === StateCategoryName.Done).map((s) => s.name),
  )
  const linked = repo.index.backlinks(project.path).filter((e) => e.kind === RelationKind.BelongsTo)
  const tasks = linked
    .flatMap((e) => {
      const item = repo.index.get(e.from)
      return item?.type === ItemType.Task && item.id !== undefined ? [item] : []
    })
    .sort(byRank)
    .map((t) => taskCard(repo, t, doneStates))
  const others = repo.index
    .backlinks(project.path)
    .flatMap((e) => {
      const item = repo.index.get(e.from)
      return item !== undefined && item.type !== ItemType.Task && item.id !== undefined
        ? [{ id: item.id, type: item.type ?? '', title: item.title ?? item.id }]
        : []
    })
    .sort((a, b) => a.id.localeCompare(b.id))
  return {
    ...projectRow(repo, project),
    columns: states.map((s): BoardColumn => ({ name: s.name, category: s.category })),
    tasks,
    linked: [...new Map(others.map((o) => [o.id, o])).values()] as BoardItem[],
  }
}
