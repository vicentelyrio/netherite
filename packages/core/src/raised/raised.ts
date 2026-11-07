import { AdrStatus, FreshnessState, ItemType } from '@netherite/schema'
import type { Freshness } from '../freshness'
import type { Repo } from '../ops/repo'
import { tagMap } from '../tag-map'
import { fieldsOf } from '../views'

export type RaisedRule =
  | 'stale-doc'
  | 'proposed-adr'
  | 'orphan'
  | 'overdue-task'
  | 'closing-commit'
  | 'new-todo'
  | 'similar-tag'

export const raisedRules: ReadonlyArray<RaisedRule> = [
  'stale-doc',
  'proposed-adr',
  'orphan',
  'overdue-task',
  'closing-commit',
  'new-todo',
  'similar-tag',
]

export interface Raised {
  readonly key: string
  readonly rule: RaisedRule
  readonly title: string
  readonly detail: string
  readonly id?: string
  readonly path?: string
  readonly line?: number
  readonly date?: string
  readonly commit?: string
}

export interface RaisedInput {
  readonly freshness?: ReadonlyMap<string, Freshness>
  readonly commits?: ReadonlyArray<{ hash: string; date: string; subject: string }>
  readonly todos?: ReadonlyArray<{
    hash: string
    date: string
    path: string
    line: number
    text: string
  }>
  readonly now?: string
}

export const enabledRules = (repo: Repo): ReadonlySet<RaisedRule> => {
  const inbox = (repo.workspace.config as Record<string, unknown>).inbox
  const rules =
    typeof inbox === 'object' && inbox !== null ? (inbox as { rules?: unknown }).rules : undefined
  const off = new Set<string>()
  if (typeof rules === 'object' && rules !== null)
    for (const [name, value] of Object.entries(rules)) if (value === false) off.add(name)
  return new Set(raisedRules.filter((r) => !off.has(r)))
}

const closing = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b[^\n]*?\b(TASK-\d+)/gi

export const raised = (repo: Repo, input: RaisedInput = {}): ReadonlyArray<Raised> => {
  const on = enabledRules(repo)
  const out: Raised[] = []
  const today = (input.now ?? new Date().toISOString()).slice(0, 10)
  const categoryOf = new Map(repo.workspace.config.states.map((s) => [s.name, s.category]))
  const items = repo.index.items()

  if (on.has('stale-doc'))
    for (const [path, f] of input.freshness ?? []) {
      const item = repo.index.get(path)
      if (
        item?.id === undefined ||
        (f.state !== FreshnessState.Stale && f.state !== FreshnessState.Drifting)
      )
        continue
      if (item.type !== ItemType.Doc && item.type !== ItemType.Runbook) continue
      out.push({
        key: `stale-doc:${item.id}`,
        rule: 'stale-doc',
        id: item.id,
        path,
        title: item.title ?? item.id,
        detail: `${f.commits} commit${f.commits === 1 ? '' : 's'} to covered code since it was last reviewed`,
        ...(f.baseline === undefined ? {} : { date: f.baseline.date }),
      })
    }

  if (on.has('proposed-adr'))
    for (const item of items) {
      if (
        item.type !== ItemType.Adr ||
        item.id === undefined ||
        fieldsOf(item).status !== AdrStatus.Proposed
      )
        continue
      const created = fieldsOf(item).created
      out.push({
        key: `proposed-adr:${item.id}`,
        rule: 'proposed-adr',
        id: item.id,
        path: item.path,
        title: item.title ?? item.id,
        detail: 'Proposed, waiting for a decision',
        ...(typeof created === 'string' ? { date: created } : {}),
      })
    }

  if (on.has('orphan'))
    for (const item of items) {
      if (item.id === undefined || !repo.index.isOrphan(item.path)) continue
      if (item.type === ItemType.Doc || item.type === ItemType.Runbook) continue
      out.push({
        key: `orphan:${item.id}`,
        rule: 'orphan',
        id: item.id,
        path: item.path,
        title: item.title ?? item.id,
        detail: 'Nothing links to it',
      })
    }

  if (on.has('overdue-task'))
    for (const item of items) {
      if (item.type !== ItemType.Task || item.id === undefined) continue
      const f = fieldsOf(item)
      const due = typeof f.due === 'string' ? f.due.slice(0, 10) : undefined
      if (due === undefined || due >= today) continue
      if (categoryOf.get(String(f.state ?? '')) === 'done') continue
      out.push({
        key: `overdue-task:${item.id}:${due}`,
        rule: 'overdue-task',
        id: item.id,
        path: item.path,
        title: item.title ?? item.id,
        detail: `Due ${due}, still ${String(f.state ?? 'open')}`,
        date: due,
      })
    }

  if (on.has('closing-commit')) {
    const seen = new Set<string>()
    for (const c of input.commits ?? []) {
      for (const m of c.subject.matchAll(closing)) {
        const id = (m[1] as string).toUpperCase()
        const task = repo.index.findById(id)[0]
        if (task === undefined || seen.has(id)) continue
        if (categoryOf.get(String(fieldsOf(task).state ?? '')) === 'done') continue
        seen.add(id)
        out.push({
          key: `closing-commit:${id}:${c.hash.slice(0, 12)}`,
          rule: 'closing-commit',
          id,
          path: task.path,
          title: task.title ?? id,
          detail: `${c.hash.slice(0, 7)} “${c.subject}” closes it, but it is still open`,
          date: c.date,
          commit: c.hash,
        })
      }
    }
  }

  if (on.has('new-todo'))
    for (const t of input.todos ?? [])
      out.push({
        key: `new-todo:${t.hash.slice(0, 12)}:${t.path}:${t.line}`,
        rule: 'new-todo',
        path: t.path,
        line: t.line,
        title: t.text.trim(),
        detail: `${t.path}:${t.line}`,
        date: t.date,
        commit: t.hash,
      })

  if (on.has('similar-tag'))
    for (const d of tagMap(repo).duplicates) {
      const [a, b] = [d.a.name, d.b.name].sort()
      out.push({
        key: `similar-tag:${d.a.field}:${a}|${b}`,
        rule: 'similar-tag',
        title: `${a} and ${b}`,
        detail: d.reason === 'name' ? 'Spelled almost the same' : 'Spelled alike and used together',
      })
    }

  return out.sort(
    (x, y) => (y.date ?? '').localeCompare(x.date ?? '') || x.key.localeCompare(y.key),
  )
}
