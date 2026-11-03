import { Button } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useInboxState } from '../InboxProvider'

/** "Mark as seen": nothing is left to mark when nothing changed. */
export function InboxActions() {
  const { LL } = useI18nContext()
  const { seen, changed } = useInboxState()
  return (
    <Button icon="done_all" onClick={seen} disabled={changed === 0}>
      {LL.inbox.markSeen()}
    </Button>
  )
}
