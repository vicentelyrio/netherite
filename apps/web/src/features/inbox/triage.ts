import type { Inbox } from '@netherite/api'
import dayjs from 'dayjs'
import { addDays } from '@/infrastructure/datetime'

export type Raised = (typeof Inbox.Type)['raised'][number]
export type Rule = Raised['rule'] | 'capture'
export type Entry = Omit<Raised, 'rule'> & { readonly rule: Rule }
export type Tab = 'all' | 'captured' | 'review' | 'commits' | 'changes'
export const groups = ['captured', 'review', 'commits'] as const satisfies ReadonlyArray<Tab>

export const captureEntry = (text: string): Entry => ({
  key: `capture:${text}`,
  rule: 'capture',
  title: text,
  detail: '',
})

export const ruleLook: Readonly<Record<Rule, { icon: string; tone: string }>> = {
  capture: { icon: 'edit_note', tone: '#b9bcd3' },
  'stale-doc': { icon: 'warning', tone: '#e2ae4c' },
  'proposed-adr': { icon: 'pending', tone: '#a5a7ff' },
  orphan: { icon: 'link_off', tone: '#b9bcd3' },
  'overdue-task': { icon: 'event_busy', tone: '#f0717e' },
  'closing-commit': { icon: 'commit', tone: '#2cc27e' },
  'new-todo': { icon: 'code', tone: '#8fc3f2' },
  'similar-tag': { icon: 'sell', tone: '#a5a7ff' },
}

export const tabOf = (rule: Rule): (typeof groups)[number] =>
  rule === 'capture'
    ? 'captured'
    : rule === 'closing-commit' || rule === 'new-todo'
      ? 'commits'
      : 'review'

export type Hidden = Readonly<
  Record<string, { readonly kind: 'archive' } | { readonly kind: 'snooze'; readonly until: string }>
>

const storeKey = 'netherite:inbox-hidden'

export const readHidden = (): Hidden => {
  try {
    const raw = localStorage.getItem(storeKey)
    return raw === null ? {} : (JSON.parse(raw) as Hidden)
  } catch {
    return {}
  }
}

export const writeHidden = (hidden: Hidden) => {
  try {
    localStorage.setItem(storeKey, JSON.stringify(hidden))
  } catch {}
}

export const isHidden = (hidden: Hidden, key: string, now: number) => {
  const h = hidden[key]
  return h !== undefined && (h.kind === 'archive' || dayjs(h.until).valueOf() > now)
}

export const snoozeUntil = (now: Date) => {
  return dayjs(now).add(1, 'day').hour(9).minute(0).second(0).millisecond(0).toISOString()
}

export const tagPair = (item: Pick<Entry, 'key'>) => {
  const m = /^similar-tag:(tags|labels):(.*)\|(.*)$/.exec(item.key)
  return m === null
    ? undefined
    : { field: m[1] as 'tags' | 'labels', keep: m[2] as string, merge: m[3] as string }
}

export const weekAfter = (date: string | undefined, now: Date) => {
  const today = dayjs(now).format('YYYY-MM-DD')
  const from = date === undefined ? today : date.slice(0, 10)
  return addDays([from, today].sort().at(-1) as string, 7)
}

export const step = (keys: ReadonlyArray<string>, current: string | undefined, delta: number) => {
  if (keys.length === 0) return undefined
  const at = current === undefined ? -1 : keys.indexOf(current)
  const next = at === -1 ? (delta > 0 ? 0 : keys.length - 1) : at + delta
  return keys[Math.max(0, Math.min(keys.length - 1, next))]
}

export const todoTitle = (text: string) => {
  const title = text
    .replace(/^\s*(?:\/\/+|\/\*+|\*+|#+|--|<!--)\s*/, '')
    .replace(/\s*(?:\*\/|-->)\s*$/, '')
    .replace(/^TODO(?:\([^)]*\))?\s*[:-]?\s*/i, '')
    .trim()
  return title === '' ? text.trim() : title
}

const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []

export const suggestFor = (
  text: string,
  projects: ReadonlyArray<{ readonly id: string; readonly title: string }>,
  tags: ReadonlyArray<string>,
) => {
  const said = new Set(words(text))
  const project = projects.find((p) => words(p.title).some((w) => w.length > 3 && said.has(w)))
  return {
    project: project?.id,
    tags: tags.filter((t) => said.has(t.toLowerCase())).slice(0, 3),
  }
}

export const folderOf = {
  task: 'tasks',
  doc: 'docs',
  adr: 'adr',
  runbook: 'runbooks',
  context: 'context',
} as const

export const slugOf = (title: string) => words(title).slice(0, 8).join('-') || 'untitled'
