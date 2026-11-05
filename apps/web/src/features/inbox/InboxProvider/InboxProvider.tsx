import type { Inbox } from '@netherite/api'
import { Banner } from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { now as clock, nowIso } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { inboxQuery, keys, useWrite, waitingCount } from '@/infrastructure/query'
import {
  captureEntry,
  type Entry,
  groups,
  type Hidden,
  isHidden,
  readHidden,
  snoozeUntil,
  step,
  type Tab,
  tabOf,
  writeHidden,
} from '../triage'
import { lastSeen, markSeen } from '../waiting'

export interface InboxState {
  readonly inbox: typeof Inbox.Type
  readonly waiting: number
  readonly changed: number
  readonly since: string | undefined
  readonly all: boolean
  readonly showAll: () => void
  readonly seen: () => void
  readonly tab: Tab
  readonly setTab: (tab: Tab) => void
  readonly open: ReadonlyArray<Entry>
  readonly shown: ReadonlyArray<Entry>
  readonly countOf: (tab: Tab) => number
  readonly snoozed: number
  readonly selected: Entry | undefined
  readonly select: (key: string | undefined) => void
  readonly move: (delta: number) => void
  readonly archive: (item: Entry) => void
  readonly snooze: (item: Entry) => void
}

const Context = createContext<InboxState | undefined>(undefined)

export const useInboxState = (): InboxState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useInboxState needs an InboxProvider')
  return value
}

export function InboxProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const client = useQueryClient()
  const [since, setSince] = useState(lastSeen)
  const [all, setAll] = useState(false)
  const notices = useNotices()
  const query = useQuery(inboxQuery(api, since))
  const [picked, setTab] = useState<Tab | undefined>(undefined)
  const [hidden, setHidden] = useState<Hidden>(readHidden)
  const [pick, select] = useState<string | undefined>(undefined)
  const release = useWrite(api, (a, text: string) =>
    a.call((c) => c.inbox.release({ query: { text } })),
  )
  const data = query.data
  const triage = useMemo(() => {
    const at = clock().valueOf()
    const raised: ReadonlyArray<Entry> = [
      ...(data?.captures ?? []).map((c) => captureEntry(c.text)),
      ...(data?.raised ?? []),
    ]
    return {
      open: raised.filter((r) => !isHidden(hidden, r.key, at)),
      snoozed: raised.filter((r) => hidden[r.key]?.kind === 'snooze' && isHidden(hidden, r.key, at))
        .length,
    }
  }, [data, hidden])

  if (query.isPending) return <div className="app-page app-muted">{LL.common.loading()}</div>
  if (query.isError) {
    return (
      <div className="app-page">
        <Banner variant="danger" title={LL.inbox.loadError()}>
          {LL.common.serveHint()}
        </Banner>
      </div>
    )
  }
  const inbox = query.data
  const tab: Tab = picked ?? 'all'
  const shown = groups
    .flatMap((g) => triage.open.filter((r) => tabOf(r.rule) === g))
    .filter((r) => tab === 'all' || tabOf(r.rule) === tab)
  const hide = (item: Entry, how: Hidden[string], label: string) => {
    const before = hidden
    const next = { ...hidden, [item.key]: how }
    writeHidden(next)
    setHidden(next)
    const rest = shown.filter((r) => r.key !== item.key).map((r) => r.key)
    const at = shown.findIndex((r) => r.key === item.key)
    select(rest[Math.min(at, rest.length - 1)])
    notices.notify({
      variant: 'info',
      title: label,
      text: item.title,
      actions: [
        {
          label: LL.inbox.undo(),
          run: () => {
            writeHidden(before)
            setHidden(before)
          },
        },
      ],
    })
  }
  const value: InboxState = {
    inbox,
    waiting: waitingCount(inbox),
    changed: inbox.activity.length + inbox.changes.length,
    since,
    all,
    showAll: () => setAll(true),
    seen: () => {
      const now = nowIso()
      markSeen(now)
      setSince(now)
      void client.invalidateQueries({ queryKey: keys.inbox })
    },
    tab,
    setTab,
    open: triage.open,
    shown,
    countOf: (t) =>
      t === 'all' ? triage.open.length : triage.open.filter((r) => tabOf(r.rule) === t).length,
    snoozed: triage.snoozed,
    selected: shown.find((r) => r.key === pick) ?? shown[0],
    select,
    move: (delta) =>
      select(
        step(
          shown.map((r) => r.key),
          (shown.find((r) => r.key === pick) ?? shown[0])?.key,
          delta,
        ),
      ),
    archive: (item) => {
      if (item.rule === 'capture') release.mutate(item.title)
      else hide(item, { kind: 'archive' }, LL.inbox.archived())
    },
    snooze: (item) =>
      hide(item, { kind: 'snooze', until: snoozeUntil(clock().toDate()) }, LL.inbox.snoozedUntil()),
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}
