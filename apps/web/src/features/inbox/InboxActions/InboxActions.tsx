import { Button } from '@netherite/ui'
import { useInboxState } from '../InboxProvider'

/** "Mark as seen": nothing is left to mark when nothing changed. */
export function InboxActions() {
  const { seen, changed } = useInboxState()
  return (
    <Button icon="done_all" onClick={seen} disabled={changed === 0}>
      Mark as seen
    </Button>
  )
}
