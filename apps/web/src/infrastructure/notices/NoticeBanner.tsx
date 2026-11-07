import { Banner, Button } from '@netherite/ui'
import { useEffect } from 'react'
import { lifetime } from './lifetime'
import type { Notice } from './notices.types'

export function NoticeBanner({
  notice,
  paused,
  onDismiss,
}: {
  readonly notice: Notice
  readonly paused: boolean
  readonly onDismiss: (id: number) => void
}) {
  const ms = lifetime(notice)
  useEffect(() => {
    if (ms === undefined || paused) return
    const timer = window.setTimeout(() => onDismiss(notice.id), ms)
    return () => window.clearTimeout(timer)
  }, [ms, paused, notice.id, onDismiss])
  return (
    <Banner
      className="app-notice"
      variant={notice.variant}
      title={notice.title}
      onClose={() => onDismiss(notice.id)}
      {...(notice.actions
        ? {
            actions: notice.actions.map((action) => (
              <Button
                key={action.label}
                onClick={() => {
                  action.run()
                  onDismiss(notice.id)
                }}
              >
                {action.label}
              </Button>
            )),
          }
        : {})}
    >
      {notice.text}
    </Banner>
  )
}
