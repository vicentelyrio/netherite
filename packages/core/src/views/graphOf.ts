import {
  FreshnessState,
  GoalStatus,
  ItemType,
  ProgressStatus,
  ProjectStatus,
  RelationKind,
} from '@netherite/schema'
import type { Freshness } from '../freshness'
import type { Repo } from '../ops/repo'
import type { ScannedItem } from '../scanned-item'
import { fieldsOf } from './fieldsOf'

export type NodeStatus = 'backlog' | 'progress' | 'hold' | 'done'

const statusOfCategory = {
  todo: 'backlog',
  active: 'progress',
  blocked: 'hold',
  done: 'done',
} as const

const ratio = (progress: { readonly done: number; readonly total: number } | undefined) =>
  progress === undefined || progress.total <= 0 ? 0 : progress.done / progress.total

const standing = (
  repo: Repo,
  item: ScannedItem,
  categories: ReadonlyMap<string, keyof typeof statusOfCategory>,
): { readonly status: NodeStatus; readonly progress: number } | undefined => {
  const f = fieldsOf(item)
  const progress = repo.index.progress(item.path)
  if (item.type === ItemType.Task) {
    const category = typeof f.state === 'string' ? categories.get(f.state) : undefined
    const status = statusOfCategory[category ?? 'todo']
    return { status, progress: status === ProgressStatus.Done ? 1 : ratio(progress) }
  }
  if (item.type === ItemType.Project) {
    const own = f.status
    const all = ratio(progress)
    const status: NodeStatus =
      own === ProgressStatus.Done || own === ProjectStatus.Archived
        ? 'done'
        : own === ProjectStatus.Paused
          ? 'hold'
          : all === 1
            ? 'done'
            : 'progress'
    return { status, progress: status === ProgressStatus.Done ? 1 : all }
  }
  if (item.type === ItemType.Goal) {
    const own = f.status
    const status: NodeStatus =
      own === GoalStatus.Achieved ? 'done' : own === GoalStatus.Dropped ? 'hold' : 'progress'
    return { status, progress: status === ProgressStatus.Done ? 1 : ratio(progress) }
  }
  return undefined
}

export const graphOf = (
  repo: Repo,
  freshness?: ReadonlyMap<string, Freshness>,
  since?: ReadonlyMap<string, string>,
) => {
  const items = repo.index.items()
  const idOf = new Map(items.map((i) => [i.path, i.id]))
  const categories = new Map(
    repo.workspace.config.states.map((st) => [
      st.name,
      st.category as keyof typeof statusOfCategory,
    ]),
  )
  const nodes = items.flatMap((item) => {
    if (item.id === undefined || item.type === undefined) return []
    const where = standing(repo, item, categories)
    const parent = repo.index
      .outgoing(item.path)
      .find((e) => e.kind === RelationKind.BelongsTo && idOf.get(e.to) !== undefined)
    const stale = freshness?.get(item.path)?.state === FreshnessState.Stale
    return [
      {
        id: item.id,
        type: item.type,
        title: item.title ?? item.id,
        path: item.path,
        ...(where === undefined ? {} : where),
        ...(parent === undefined ? {} : { parent: idOf.get(parent.to) as string }),
        ...(stale ? { stale: true } : {}),
        ...(where === undefined || since?.get(item.id) === undefined
          ? {}
          : { since: since.get(item.id) as string }),
      },
    ]
  })
  const edges = items.flatMap((item) =>
    repo.index.outgoing(item.path).flatMap((edge) => {
      const from = idOf.get(edge.from)
      const to = idOf.get(edge.to)
      return from === undefined || to === undefined ? [] : [{ from, to, kind: edge.kind }]
    }),
  )
  return { nodes, edges }
}
