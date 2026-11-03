import {
  InboxActions,
  InboxGroups,
  InboxHeading,
  InboxProvider,
  InboxToolbar,
  TriageDetail,
  TriageList,
  useInboxState,
} from '@/features/inbox'
import { SplitTemplate } from '@/templates'

function Main() {
  const { tab } = useInboxState()
  return tab === 'changes' ? <InboxGroups /> : <TriageList />
}

/** The Inbox: what the repo raises for you to triage, and what changed since you last looked. */
export function InboxPage() {
  return (
    <InboxProvider>
      <SplitTemplate
        header={<InboxHeading />}
        actions={<InboxActions />}
        toolbar={<InboxToolbar />}
        main={<Main />}
        aside={<TriageDetail />}
      />
    </InboxProvider>
  )
}
