import { Avatar, Rail, type RailItem } from '@netherite/ui'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useApi } from '@/infrastructure/api'
import { useHealth, useInbox, waitingCount } from '@/infrastructure/query'
import { useResolvedShortcuts } from '@/infrastructure/shortcuts'
import { actionOf, activeFor, railItems } from '../rail'

/**
 * The navigation rail: the app's sections with their keys (from the settings), a badge on the
 * Inbox for what waits for you, and who you are at the bottom. Search opens the palette.
 */
export function AppRail({ onSearch }: { readonly onSearch: () => void }) {
  const api = useApi()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
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
    if (id === 'search') return onSearch()
    const to = railItems.find((i) => i.id === id)?.to
    if (to !== undefined) void navigate({ to })
  }

  return (
    <Rail
      items={items}
      active={activeFor(pathname)}
      onSelect={select}
      footer={
        health.data?.user ? <Avatar name={health.data.user} size={32} color="warning" /> : null
      }
    />
  )
}
