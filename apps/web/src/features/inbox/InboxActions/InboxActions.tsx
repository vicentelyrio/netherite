import { Button } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useShortcutHint } from '@/infrastructure/shortcuts'
import { useInboxState } from '../InboxProvider'
import './InboxActions.css'

export function InboxActions() {
  const { LL } = useI18nContext()
  const { seen, changed } = useInboxState()
  const next = useShortcutHint('inbox.next')
  const previous = useShortcutHint('inbox.previous')
  const archive = useShortcutHint('inbox.archive')
  const snooze = useShortcutHint('inbox.snooze')
  return (
    <div className="ia">
      <ul className="ia-keys" aria-label={LL.inbox.keys.label()}>
        {(next !== undefined || previous !== undefined) && (
          <li>
            {next !== undefined && <kbd>{next}</kbd>}
            {previous !== undefined && <kbd>{previous}</kbd>}
            {LL.inbox.keys.move()}
          </li>
        )}
        {archive !== undefined && (
          <li>
            <kbd>{archive}</kbd>
            {LL.inbox.keys.archive()}
          </li>
        )}
        {snooze !== undefined && (
          <li>
            <kbd>{snooze}</kbd>
            {LL.inbox.keys.snooze()}
          </li>
        )}
      </ul>
      <Button icon="done_all" onClick={seen} disabled={changed === 0}>
        {LL.inbox.markSeen()}
      </Button>
    </div>
  )
}
