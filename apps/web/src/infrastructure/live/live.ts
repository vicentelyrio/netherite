import { ServerEvent } from '@netherite/api'
import type { QueryClient } from '@tanstack/react-query'
import { Schema } from 'effect'
import { useEffect, useState } from 'react'
import { keys } from '../query'

/** Which queries a server event makes stale. */
export const invalidationsFor = (event: ServerEvent): ReadonlyArray<ReadonlyArray<unknown>> => {
  switch (event.type) {
    case 'items':
      return [
        ['items', 'list'],
        ...event.ids.flatMap((id) => [keys.item(id), keys.source(id)]),
        keys.health,
        ['search'],
        keys.graph,
        keys.goals,
        keys.knowledge,
        keys.projects,
        keys.inbox,
        keys.history,
        keys.stats,
        keys.timeline,
        keys.tags,
      ]
    case 'git':
      return [keys.knowledge, keys.inbox, keys.history, keys.stats, keys.timeline, keys.health]
    case 'lint':
      return [keys.lint, keys.inbox]
    case 'config':
      return [[]]
    default:
      return []
  }
}

export type Connection = 'connecting' | 'live' | 'offline'

export interface LiveOptions {
  readonly baseUrl: string
  readonly client: QueryClient
  /** Called for events that are about the workspace itself, not for data. */
  readonly onNotice?: (event: Extract<ServerEvent, { type: 'config' | 'config-invalid' }>) => void
  readonly onConnection?: (state: Connection) => void
}

const decode = Schema.decodeUnknownSync(ServerEvent)

/**
 * Follows the server's event stream and refreshes what it says changed (ADR-00010). When the
 * connection comes back after a break, everything is refreshed, because events were missed.
 * Returns a function that stops listening.
 */
export const followServer = ({ baseUrl, client, onNotice, onConnection }: LiveOptions) => {
  const source = new EventSource(`${baseUrl}/api/events`)
  let dropped = false
  onConnection?.('connecting')

  source.onopen = () => {
    onConnection?.('live')
    if (dropped) {
      dropped = false
      void client.invalidateQueries()
    }
  }
  source.onerror = () => {
    dropped = true
    onConnection?.('offline')
  }
  source.onmessage = (message) => {
    let event: ServerEvent
    try {
      event = decode(JSON.parse(message.data))
    } catch {
      return
    }
    for (const queryKey of invalidationsFor(event))
      void client.invalidateQueries({ queryKey: [...queryKey] })
    if (event.type === 'config' || event.type === 'config-invalid') onNotice?.(event)
  }
  return () => source.close()
}

/** The connection's state, and the subscription that keeps the queries fresh. */
export const useLiveUpdates = (options: Omit<LiveOptions, 'onConnection'>) => {
  const [state, setState] = useState<Connection>('connecting')
  const { baseUrl, client, onNotice } = options
  useEffect(
    () =>
      followServer({ baseUrl, client, ...(onNotice ? { onNotice } : {}), onConnection: setState }),
    [baseUrl, client, onNotice],
  )
  return state
}
