import { Breadcrumbs } from '@/components'
import { ago } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useInboxState } from '../InboxProvider'

/** Breadcrumb, title, how many things need you and how far back the changes go. */
export function InboxHeading() {
  const { LL } = useI18nContext()
  const { waiting, since } = useInboxState()
  return (
    <div>
      <Breadcrumbs icon="inbox">
        <strong>{LL.inbox.heading.title()}</strong>
      </Breadcrumbs>
      <h1 className="app-title kn-h1">{LL.inbox.heading.title()}</h1>
      <p className="kn-sub">
        {waiting === 0 ? LL.inbox.heading.clear() : LL.inbox.heading.waiting({ count: waiting })}
        {' · '}
        {since ? LL.inbox.heading.since({ when: ago(since) }) : LL.inbox.heading.sinceStart()}
      </p>
    </div>
  )
}
