import {
  InboxActions,
  InboxHeading,
  InboxProvider,
  InboxToolbar,
  TriageDetail,
} from '@/features/inbox'
import { SplitTemplate } from '@/templates'
import { InboxMain } from './InboxMain'

export function InboxPage() {
  return (
    <InboxProvider>
      <SplitTemplate
        header={<InboxHeading />}
        actions={<InboxActions />}
        toolbar={<InboxToolbar />}
        main={<InboxMain />}
        aside={<TriageDetail />}
      />
    </InboxProvider>
  )
}
