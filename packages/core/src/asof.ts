import type { Freshness } from './freshness'
import type { FieldValue, History, ItemHistory } from './history'
import { lifecycles } from './lifecycle'
import type { Repo } from './ops/repo'
import type { NodeStatus } from './views'
import type { EdgeKind } from './workspace-index'

export interface AsOfNode {
  readonly id: string
  readonly type: string
  readonly title: string
  readonly path: string
  readonly status?: NodeStatus
  readonly progress?: number
  readonly parent?: string
  readonly stale?: boolean
}

export interface AsOfGraph {
  readonly nodes: ReadonlyArray<AsOfNode>
  readonly edges: ReadonlyArray<{
    readonly from: string
    readonly to: string
    readonly kind: EdgeKind
  }>
  readonly asOf: string
  readonly approximate: boolean
}

export interface AsOfOptions {
  readonly asOf: string
  readonly now?: string
  readonly freshness?: ReadonlyMap<string, Freshness> | undefined
}

const endOfDay = (date: string) => (date.length <= 10 ? `${date}T23:59:59.999Z` : date)

const text = (value: FieldValue) => (typeof value === 'string' ? value : undefined)

const valueAt = (item: ItemHistory | undefined, field: string, at: number): FieldValue => {
  let value: FieldValue
  for (const t of item?.transitions ?? []) {
    if (t.field !== field || Date.parse(t.date) > at) continue
    value = t.to
  }
  return value
}

const first = (value: FieldValue) =>
  Array.isArray(value) ? (value[0] as string | undefined) : text(value)

export const graphAsOf = (repo: Repo, history: History, options: AsOfOptions): AsOfGraph => {
  const at = Date.parse(endOfDay(options.asOf))
  const now = Date.parse(options.now ?? new Date().toISOString())
  const states = repo.workspace.config.states
  const categories = new Map(states.map((s) => [s.name, s.category]))
  const life = lifecycles(history, { states, now: new Date(Math.min(at, now)).toISOString() })

  const items = repo.index.items()
  const existing = items.filter((item) => {
    if (item.id === undefined || item.type === undefined) return false
    const made = life.get(item.id)?.created
    return made === undefined ? at >= now : Date.parse(made) <= at
  })
  const ids = new Set(existing.map((i) => i.id as string))

  const parentOf = new Map<string, string>()
  for (const item of existing) {
    const id = item.id as string
    const past = history.items.get(id)
    const parent =
      item.type === 'task'
        ? first(valueAt(past, 'project', at))
        : item.type === 'project'
          ? first(valueAt(past, 'goals', at))
          : undefined
    if (parent !== undefined && ids.has(parent)) parentOf.set(id, parent)
  }

  const taskDone = new Map<string, boolean>()
  const children = new Map<string, string[]>()
  for (const item of existing) {
    const id = item.id as string
    if (item.type === 'task') {
      const state = text(valueAt(history.items.get(id), 'state', at))
      taskDone.set(id, (state === undefined ? undefined : categories.get(state)) === 'done')
    }
    const parent = parentOf.get(id)
    if (parent !== undefined) children.set(parent, [...(children.get(parent) ?? []), id])
  }
  const tasksUnder = (id: string): string[] =>
    (children.get(id) ?? []).flatMap((child) => (taskDone.has(child) ? [child] : tasksUnder(child)))
  const share = (id: string) => {
    const tasks = tasksUnder(id)
    return tasks.length === 0 ? 0 : tasks.filter((t) => taskDone.get(t)).length / tasks.length
  }

  const nodes = existing.map((item): AsOfNode => {
    const id = item.id as string
    const past = history.items.get(id)
    const base = { id, type: item.type as string, title: item.title ?? id, path: item.path }
    const parent = parentOf.get(id)
    const own: { status?: NodeStatus; progress?: number } = {}
    if (item.type === 'task') {
      const state = text(valueAt(past, 'state', at))
      const category = (state === undefined ? undefined : categories.get(state)) ?? 'todo'
      const status: NodeStatus =
        category === 'done'
          ? 'done'
          : category === 'blocked'
            ? 'hold'
            : category === 'active'
              ? 'progress'
              : 'backlog'
      own.status = status
      own.progress = status === 'done' ? 1 : 0
    } else if (item.type === 'project') {
      const status = text(valueAt(past, 'status', at))
      const all = share(id)
      const result: NodeStatus =
        status === 'done' || status === 'archived'
          ? 'done'
          : status === 'paused'
            ? 'hold'
            : all === 1
              ? 'done'
              : 'progress'
      own.status = result
      own.progress = result === 'done' ? 1 : all
    } else if (item.type === 'goal') {
      const status = text(valueAt(past, 'status', at))
      const result: NodeStatus =
        status === 'achieved' ? 'done' : status === 'dropped' ? 'hold' : 'progress'
      own.status = result
      own.progress = result === 'done' ? 1 : share(id)
    }
    const stale = options.freshness?.get(item.path)?.state === 'stale'
    return {
      ...base,
      ...own,
      ...(parent === undefined ? {} : { parent }),
      ...(stale ? { stale: true } : {}),
    }
  })

  const idOf = new Map(items.map((i) => [i.path, i.id]))
  const accepted = (id: string) =>
    life.get(id)?.events.find((e) => e.kind === 'accepted' && Date.parse(e.date) <= at) !==
    undefined
  const edges = existing.flatMap((item) =>
    repo.index.outgoing(item.path).flatMap((edge) => {
      const from = idOf.get(edge.from)
      const to = idOf.get(edge.to)
      if (from === undefined || to === undefined || !ids.has(from) || !ids.has(to)) return []
      if (edge.kind === 'supersedes' && !accepted(from)) return []
      return [{ from, to, kind: edge.kind }]
    }),
  )

  return {
    nodes,
    edges,
    asOf: new Date(at).toISOString(),
    approximate: history.partial,
  }
}
