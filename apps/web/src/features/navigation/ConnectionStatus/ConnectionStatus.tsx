import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useApi } from '@/infrastructure/api'
import { type Connection, useLiveUpdates } from '@/infrastructure/live'
import { useNotices } from '@/infrastructure/notices'
import { useHealth } from '@/infrastructure/query'
import './ConnectionStatus.css'

const statusText: Record<Connection, string> = {
  connecting: 'Connecting…',
  live: 'Live',
  offline: 'Offline: reconnecting',
}

/**
 * The thin bar above every screen: whether the live connection to the server is up, and how many
 * items there are. It also keeps queries fresh from the server's events, and says when the config
 * is wrong or needs a restart.
 */
export function ConnectionStatus() {
  const api = useApi()
  const client = useQueryClient()
  const notices = useNotices()
  const health = useHealth(api)

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

  return (
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
  )
}
