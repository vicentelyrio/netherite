import { Icon } from '@netherite/ui'
import type { CSSProperties } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { useShortcutHint } from '@/infrastructure/shortcuts'
import { useInboxState } from '../InboxProvider'
import { type Entry, ruleLook } from '../triage'

const iconSize = 18

export function TriageTop({ item }: { readonly item: Entry }) {
  const { LL } = useI18nContext()
  const { archive, snooze } = useInboxState()
  const look = ruleLook[item.rule]
  const snoozeKeys = useShortcutHint('inbox.snooze')
  const archiveKeys = useShortcutHint('inbox.archive')
  const titled = (name: string, keys: string | undefined) =>
    keys === undefined ? name : `${name} (${keys})`
  return (
    <div className="trd-top">
      <span className="trd-kind" style={{ '--tri-tone': look.tone } as CSSProperties}>
        <Icon
          name={look.icon}
          size="inline"
          filled={item.rule === 'stale-doc'}
          className="trd-kind-icon"
        />
        <strong>{LL.inbox.rules[item.rule]()}</strong>
        {item.date !== undefined && <span>{item.date.slice(0, 10)}</span>}
      </span>
      <span className="trd-icons">
        <button
          type="button"
          className="trd-icon"
          title={titled(LL.inbox.actions.snooze(), snoozeKeys)}
          aria-label={LL.inbox.actions.snooze()}
          onClick={() => snooze(item)}
        >
          <Icon name="snooze" size={iconSize} />
        </button>
        <button
          type="button"
          className="trd-icon"
          title={titled(LL.inbox.actions.archive(), archiveKeys)}
          aria-label={LL.inbox.actions.archive()}
          onClick={() => archive(item)}
        >
          <Icon name="archive" size={iconSize} />
        </button>
      </span>
    </div>
  )
}
