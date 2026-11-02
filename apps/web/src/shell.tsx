import { Avatar, Rail, type RailItem } from '@netherite/ui'
import { useQueryClient } from '@tanstack/react-query'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useApi } from './lib/app-context'
import { type Connection, useLiveUpdates } from './lib/live'
import { useNotices } from './lib/notices'
import { useHealth, useInbox } from './lib/queries'
import { SearchPalette } from './search'

/** The rail's items and where each goes (Rail.dc.html). Command-K opens search instead of a page. */
export const railItems: ReadonlyArray<RailItem & { readonly to?: string }> = [
  { id: 'search', label: 'Search', icon: 'search', shortcut: 'mod+k' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', shortcut: 'mod+i', group: 'inbox', to: '/inbox' },
  {
    id: 'goals',
    label: 'Goals',
    icon: 'track_changes',
    shortcut: 'mod+g',
    group: 'work',
    to: '/goals',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'task_alt',
    shortcut: 'mod+p',
    aliases: ['mod+alt+p'],
    group: 'work',
    to: '/projects',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: 'stacks',
    shortcut: 'mod+l',
    aliases: ['mod+alt+l'],
    group: 'work',
    to: '/knowledge',
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: 'bar_chart',
    shortcut: 'mod+d',
    aliases: ['mod+alt+d'],
    group: 'insight',
    to: '/stats',
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: 'sell',
    shortcut: 'mod+t',
    aliases: ['mod+alt+t'],
    group: 'insight',
    to: '/tags',
  },
  {
    id: 'graph',
    label: 'Graph',
    icon: 'hub',
    shortcut: 'mod+shift+g',
    group: 'insight',
    to: '/graph',
  },
]

/** Which rail item a path belongs to. An item page belongs to Knowledge. */
export const activeFor = (pathname: string) => {
  const first = pathname.split('/')[1] ?? ''
  if (first === 'items') return 'knowledge'
  return railItems.some((i) => i.id === first) ? first : ''
}

const statusText: Record<Connection, string> = {
  connecting: 'Connecting…',
  live: 'Live',
  offline: 'Offline: reconnecting',
}

/** The frame of the app: the rail, a status bar with the live connection, and the current screen. */
export function Shell() {
  const api = useApi()
  const client = useQueryClient()
  const navigate = useNavigate()
  const notices = useNotices()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [searchOpen, setSearchOpen] = useState(false)

  const connection = useLiveUpdates({
    baseUrl: api.config.baseUrl,
    client,
    onNotice: useCallback(
      (event) => {
        if (event.type === 'config-invalid') {
          notices.notify({
            variant: 'warning',
            title: 'The config file is not valid',
            text: `${event.message} The previous config stays in use.`,
          })
        } else if (event.requiresRestart) {
          notices.notify({
            variant: 'info',
            title: 'Restart Netherite',
            text: 'The content folder moved. Stop and start `netherite` to use it.',
          })
        }
      },
      [notices],
    ),
  })

  const health = useHealth(api)
  const inbox = useInbox(api)
  // What waits for a person: decisions to make, docs gone stale, problems to fix, blocked work.
  const waiting = inbox.data
    ? inbox.data.proposed.length +
      inbox.data.freshness.length +
      inbox.data.errors.length +
      inbox.data.blocked.length
    : 0

  const items = railItems.map(({ to: _to, ...item }) =>
    item.id === 'inbox' ? { ...item, badge: waiting } : item,
  )

  const select = (id: string) => {
    if (id === 'search') return setSearchOpen(true)
    const to = railItems.find((i) => i.id === id)?.to
    if (to !== undefined) void navigate({ to })
  }

  return (
    <div className="app-shell">
      <Rail
        items={items}
        active={activeFor(pathname)}
        onSelect={select}
        footer={
          health.data?.user ? <Avatar name={health.data.user} size={32} color="warning" /> : null
        }
      />
      <div className="app-main">
        <div className="app-statusbar" role="status" aria-live="polite">
          <span className="app-status" data-state={connection}>
            <span className="app-status-dot" aria-hidden="true" />
            {statusText[connection]}
          </span>
          {health.data && (
            <span className="app-muted">
              {health.data.items} items{health.data.git ? '' : ' · no git'}
            </span>
          )}
        </div>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <SearchPalette opened={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
