import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useLiveUpdates } from '@/infrastructure/live'
import { useNotices } from '@/infrastructure/notices'
import { useHealth } from '@/infrastructure/query'
import './ConnectionStatus.css'

export function ConnectionStatus() {
  const api = useApi()
  const client = useQueryClient()
  const notices = useNotices()
  const health = useHealth(api)
  const { LL } = useI18nContext()

  const connection = useLiveUpdates({
    baseUrl: api.config.baseUrl,
    client,
    onNotice: useCallback(
      (event) => {
        if (event.type === 'config-invalid') {
          notices.notify({
            variant: 'warning',
            title: LL.navigation.configInvalid(),
            text: LL.navigation.configInvalidText({ message: event.message }),
          })
        } else if (event.requiresRestart) {
          notices.notify({
            variant: 'info',
            title: LL.navigation.restart(),
            text: LL.navigation.restartText(),
          })
        }
      },
      [notices, LL],
    ),
  })

  return (
    <div className="app-statusbar" role="status" aria-live="polite">
      <span className="app-status" data-state={connection}>
        <span className="app-status-dot" aria-hidden="true" />
        {LL.status[connection]()}
      </span>
      {health.data && (
        <span className="app-muted">
          {LL.status.items({ count: health.data.items })}
          {health.data.git ? '' : ` · ${LL.status.noGit()}`}
        </span>
      )}
    </div>
  )
}
