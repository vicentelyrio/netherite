import type { Inbox } from '@netherite/api'

export type Raised = (typeof Inbox.Type)['raised'][number]
/** What an entry is about: a rule the repo raised, or a line captured in `inbox.md`. */
export type Rule = Raised['rule'] | 'capture'
/** A line of the Inbox: something the repo raised or a capture, in one shape. */
export type Entry = Omit<Raised, 'rule'> & { readonly rule: Rule }
export type Tab = 'all' | 'captured' | 'review' | 'commits' | 'changes'
/** The groups the list is split into, in the order they are drawn. */
export const groups = ['captured', 'review', 'commits'] as const satisfies ReadonlyArray<Tab>

/** A capture as an entry, keyed by its text so the selection survives a refresh. */
export const captureEntry = (text: string): Entry => ({
  key: `capture:${text}`,
  rule: 'capture',
  title: text,
  detail: '',
})

/** The icon and colour that stand for each kind of entry. */
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

/** What each tab holds: the repo raising work to review, or work that commits point at. */
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
  } catch {
    // Private windows forget it.
  }
}

/** Archived for good, or snoozed until a time that has not come yet. */
export const isHidden = (hidden: Hidden, key: string, now: number) => {
  const h = hidden[key]
  return h !== undefined && (h.kind === 'archive' || Date.parse(h.until) > now)
}

/** Tomorrow at 09:00, local time. */
export const snoozeUntil = (now: Date) => {
  const d = new Date(now)
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

/** The two tags of a `similar-tag` item: the second is merged into the first. */
export const tagPair = (item: Pick<Entry, 'key'>) => {
  const m = /^similar-tag:(tags|labels):(.*)\|(.*)$/.exec(item.key)
  return m === null
    ? undefined
    : { field: m[1] as 'tags' | 'labels', keep: m[2] as string, merge: m[3] as string }
}

/** The day a week after `date` (or after today if it has none), as `YYYY-MM-DD`. */
export const weekAfter = (date: string | undefined, now: Date) => {
  const d = new Date(`${(date ?? now.toISOString()).slice(0, 10)}T00:00:00Z`)
  const base = Math.max(d.getTime(), Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  return new Date(base + 7 * 86_400_000).toISOString().slice(0, 10)
}

/** The next item after moving `delta` steps in a list from the one picked; stays inside the list. */
export const step = (keys: ReadonlyArray<string>, current: string | undefined, delta: number) => {
  if (keys.length === 0) return undefined
  const at = current === undefined ? -1 : keys.indexOf(current)
  const next = at === -1 ? (delta > 0 ? 0 : keys.length - 1) : at + delta
  return keys[Math.max(0, Math.min(keys.length - 1, next))]
}

/** A task title from a `TODO` line: the comment markers and the word itself are dropped. */
export const todoTitle = (text: string) => {
  const title = text
    .replace(/^\s*(?:\/\/+|\/\*+|\*+|#+|--|<!--)\s*/, '')
    .replace(/\s*(?:\*\/|-->)\s*$/, '')
    .replace(/^TODO(?:\([^)]*\))?\s*[:-]?\s*/i, '')
    .trim()
  return title === '' ? text.trim() : title
}
