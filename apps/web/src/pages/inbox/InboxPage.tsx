import { InboxActions, InboxGroups, InboxHeading, InboxProvider } from '@/features/inbox'
import { PageTemplate } from '@/templates'

/** The Inbox: what changed since you last looked, and what waits for you. */
export function InboxPage() {
  return (
    <InboxProvider>
      <PageTemplate header={<InboxHeading />} actions={<InboxActions />}>
        <InboxGroups />
      </PageTemplate>
    </InboxProvider>
  )
}
