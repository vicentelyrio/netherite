import type { Inbox } from '@netherite/api'
import { Banner } from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { nowIso } from '@/infrastructure/datetime'
import { inboxQuery, keys, waitingCount } from '@/infrastructure/query'
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
}

const Context = createContext<InboxState | undefined>(undefined)

export const useInboxState = (): InboxState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useInboxState needs an InboxProvider')
  return value
}

/** Loads the Inbox since the last time it was seen; shows loading and error instead of children. */
export function InboxProvider({ children }: { readonly children: ReactNode }) {
  const api = useApi()
  const client = useQueryClient()
  const [since, setSince] = useState(lastSeen)
  const [all, setAll] = useState(false)
  const query = useQuery(inboxQuery(api, since))

  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page">
        <Banner variant="danger" title="Could not load the inbox">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  const inbox = query.data
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
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}
