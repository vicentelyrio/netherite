import { Breadcrumbs } from '@/components'
import { ago } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useInboxState } from '../InboxProvider'

export function InboxHeading() {
  const { LL } = useI18nContext()
  const { open, since } = useInboxState()
  return (
    <div>
      <Breadcrumbs icon="inbox">
        <strong>{LL.inbox.heading.title()}</strong>
      </Breadcrumbs>
      <h1 className="app-title kn-h1">{LL.inbox.heading.title()}</h1>
      <p className="kn-sub">
        {open.length === 0
          ? LL.inbox.heading.clear()
          : LL.inbox.heading.toTriage({ count: open.length })}
        {' · '}
        {since ? LL.inbox.heading.since({ when: ago(since) }) : LL.inbox.heading.sinceStart()}
      </p>
    </div>
  )
}
