import { Avatar, Rail, type RailItem } from '@netherite/ui'
import { useQueryClient } from '@tanstack/react-query'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { type Connection, useLiveUpdates } from '@/infrastructure/live'
import { useNotices } from '@/infrastructure/notices'
import { useHealth, useInbox } from '@/infrastructure/query'
import { type ActionId, useResolvedShortcuts } from '@/infrastructure/shortcuts'
import { AppShell } from '@/templates'
import { waitingCount } from './pages/inbox'
import { SearchPalette } from './search'

/** The rail's items and where each goes (Rail.dc.html). Command-K opens search instead of a page. */
export const railItems: ReadonlyArray<
  Omit<RailItem, 'shortcut' | 'aliases'> & { readonly to?: string }
> = [
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', group: 'inbox', to: '/inbox' },
  {
    id: 'goals',
    label: 'Goals',
    icon: 'track_changes',
    group: 'work',
    to: '/goals',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'task_alt',
    group: 'work',
    to: '/projects',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: 'stacks',
    group: 'work',
    to: '/knowledge',
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: 'bar_chart',
    group: 'insight',
    to: '/stats',
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: 'sell',
    group: 'insight',
    to: '/tags',
  },
  {
    id: 'graph',
    label: 'Graph',
    icon: 'hub',
    group: 'insight',
    to: '/graph',
  },
]

/** The keyboard action behind a rail item: search opens the palette, the rest go to a page. */
const actionOf = (id: string): ActionId =>
  id === 'search' ? 'search.open' : (`go.${id}` as ActionId)

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
  const waiting = inbox.data ? waitingCount(inbox.data) : 0

  const keys = useResolvedShortcuts()
  const items: RailItem[] = railItems.map(({ to: _to, ...item }) => {
    const { keys: shortcut, aliases } = keys[actionOf(item.id)]
    const withKeys = { ...item, shortcut, ...(aliases.length > 0 ? { aliases } : {}) }
    return item.id === 'inbox' ? { ...withKeys, badge: waiting } : withKeys
  })

  const select = (id: string) => {
    if (id === 'search') return setSearchOpen(true)
    const to = railItems.find((i) => i.id === id)?.to
    if (to !== undefined) void navigate({ to })
  }

  return (
    <AppShell
      rail={
        <Rail
          items={items}
          active={activeFor(pathname)}
          onSelect={select}
          footer={
            health.data?.user ? <Avatar name={health.data.user} size={32} color="warning" /> : null
          }
        />
      }
      statusBar={
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
      }
      overlays={<SearchPalette opened={searchOpen} onClose={() => setSearchOpen(false)} />}
    >
      <Outlet />
    </AppShell>
  )
}
