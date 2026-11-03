import type { Inbox } from '@netherite/api'
import { Banner } from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { nowIso } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { inboxQuery, keys, waitingCount } from '@/infrastructure/query'
import {
  type Hidden,
  isHidden,
  type Raised,
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
  /** What waits for a person. */
  readonly waiting: number
  /** Agent changes and uncommitted changes since the last "seen". */
  readonly changed: number
  /** When the Inbox was last marked as seen. */
  readonly since: string | undefined
  /** Show every change, not the first few. */
  readonly all: boolean
  readonly showAll: () => void
  /** Marks everything up to now as seen. */
  readonly seen: () => void
  readonly tab: Tab
  readonly setTab: (tab: Tab) => void
  /** What the repo raises and nobody has archived or snoozed. */
  readonly open: ReadonlyArray<Raised>
  /** The open items on the current tab. */
  readonly shown: ReadonlyArray<Raised>
  readonly countOf: (tab: Tab) => number
  readonly snoozed: number
  readonly selected: Raised | undefined
  readonly select: (key: string | undefined) => void
  /** J and K: move the selection down (1) or up (-1). */
  readonly move: (delta: number) => void
  readonly archive: (item: Raised) => void
  readonly snooze: (item: Raised) => void
}

const Context = createContext<InboxState | undefined>(undefined)

export const useInboxState = (): InboxState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useInboxState needs an InboxProvider')
  return value
}

/** Loads the Inbox since the last time it was seen; shows loading and error instead of children. */
export function InboxProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const client = useQueryClient()
  const [since, setSince] = useState(lastSeen)
  const [all, setAll] = useState(false)
  const notices = useNotices()
  const query = useQuery(inboxQuery(api, since))
  const [tab, setTab] = useState<Tab>('review')
  const [hidden, setHidden] = useState<Hidden>(readHidden)
  const [pick, select] = useState<string | undefined>(undefined)
  const data = query.data
  const triage = useMemo(() => {
    const now = Date.now()
    const raised = data?.raised ?? []
    return {
      open: raised.filter((r) => !isHidden(hidden, r.key, now)),
      snoozed: raised.filter(
        (r) => hidden[r.key]?.kind === 'snooze' && isHidden(hidden, r.key, now),
      ).length,
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
  const shown = triage.open.filter((r) => tabOf(r.rule) === tab)
  const hide = (item: Raised, how: Hidden[string], label: string) => {
    const before = hidden
    const next = { ...hidden, [item.key]: how }
    writeHidden(next)
    setHidden(next)
    // The next item takes its place, or the one before when it was the last.
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
    countOf: (t) => triage.open.filter((r) => tabOf(r.rule) === t).length,
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
    archive: (item) => hide(item, { kind: 'archive' }, LL.inbox.archived()),
    snooze: (item) =>
      hide(item, { kind: 'snooze', until: snoozeUntil(new Date()) }, LL.inbox.snoozedUntil()),
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}
