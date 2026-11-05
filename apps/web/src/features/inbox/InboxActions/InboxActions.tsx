import { Button } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useInboxState } from '../InboxProvider'
import './InboxActions.css'

/** The keys that work the list, and "Mark as seen" (nothing is left to mark when nothing changed). */
export function InboxActions() {
  const { LL } = useI18nContext()
  const { seen, changed } = useInboxState()
  return (
    <div className="ia">
      <ul className="ia-keys" aria-label={LL.inbox.keys.label()}>
        <li>
          <kbd>J</kbd>
          <kbd>K</kbd>
          {LL.inbox.keys.move()}
        </li>
        <li>
          <kbd>E</kbd>
          {LL.inbox.keys.archive()}
        </li>
        <li>
          <kbd>H</kbd>
          {LL.inbox.keys.snooze()}
        </li>
      </ul>
      <Button icon="done_all" onClick={seen} disabled={changed === 0}>
        {LL.inbox.markSeen()}
      </Button>
    </div>
  )
}
